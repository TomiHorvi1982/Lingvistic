import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Shared Gemini Client
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI:", e);
}

// Helper function to call Gemini with retries and a fallback model to handle transient 503/rate-limit errors
async function generateContentWithRetry(params: {
  contents: string;
  config: {
    systemInstruction: string;
    temperature: number;
  };
}) {
  if (!ai) {
    throw new Error("Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.");
  }

  // Use gemini-3.5-flash as the primary highly stable free-tier model, falling back to gemini-3.1-flash-lite and gemini-flash-latest if experiencing transient issues (503/429)
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${model} (Attempt ${attempt}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        
        if (response && response.text) {
          return response;
        }
        throw new Error("Received empty response from model");
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || (typeof err === "string" ? err : JSON.stringify(err));
        console.warn(`[Gemini API Warning] Model ${model} failed on attempt ${attempt}:`, errMsg);
        
        // Check if quota is exceeded (429 or RESOURCE_EXHAUSTED) to skip useless retries on this model
        const isQuotaExceeded = 
          err.status === "RESOURCE_EXHAUSTED" || 
          err.status === 429 || 
          err.statusCode === 429 || 
          errMsg.toLowerCase().includes("quota") || 
          errMsg.toLowerCase().includes("429") ||
          errMsg.toLowerCase().includes("rate limit") ||
          errMsg.toLowerCase().includes("resource_exhausted");

        if (isQuotaExceeded) {
          console.warn(`[Gemini API] Quota exceeded for ${model}. Skipping retries of this model and switching to next fallback...`);
          break; // skip remaining attempts for this model
        }

        // Wait before retrying (exponential backoff) for transient errors like 503
        if (attempt < maxAttempts) {
          const delay = attempt * 1000; // 1s on first retry
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("All model fallback attempts failed.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API endpoints

// 1. Text Rephraser Endpoint (Level 1, 2, 3 or Reverse Simplification)
app.post("/api/rephrase", async (req, res) => {
  const { text, level, reverse } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid text parameter" });
  }

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
    });
  }

  try {
    let systemInstruction = "";
    if (reverse) {
      systemInstruction = 
        "You are an expert translator and linguist. Your goal is to translate complex, highly technical, or academic texts " +
        "and compound sentences back into very clear, friendly, and easily understandable common human language (Czech). " +
        "Make it easy to grasp for an absolute beginner while keeping the original meaning completely intact. " +
        "Return ONLY the translated text in Czech, without any meta commentary, intro, or wrapping code blocks.";
    } else {
      switch (level) {
        case 1:
          systemInstruction =
            "You are a professional Czech writer. Rephrase the input text so it is written at Level 1 of complexity: " +
            "It must contain a few relevant technical or professional terms (Czech), but must still be fully clear " +
            "and understandable to any regular average person. It is simple but slightly professional. " +
            "Return ONLY the rephrased text in Czech, without any wrapping markdown blocks or introductory comments.";
          break;
        case 2:
          systemInstruction =
            "You are an academic Czech writer. Rephrase the input text so it is written at Level 2 of complexity: " +
            "It must be designed for educated people with a higher degree of abstraction. Use intellectual, sophisticated " +
            "Czech terminology and professional syntax, without being overly obscure. " +
            "Return ONLY the rephrased text in Czech, without any wrapping markdown blocks or introductory comments.";
          break;
        case 3:
          systemInstruction =
            "You are a top-tier scientific expert, research analyst, and philosopher in Czech. Rephrase the input text " +
            "to Level 3 of complexity: " +
            "Representing an extremely deep, expert scientific and technical analysis. Use highly advanced specialized terminologies, " +
            "rigorous formal logical phrasing, and detailed professional terminology that experts in the field use. " +
            "Return ONLY the rephrased expert text in Czech, without any wrapping markdown blocks or introductory comments.";
          break;
        default:
          return res.status(400).json({ error: "Invalid level specified (must be 1, 2, or 3)" });
      }
    }

    const response = await generateContentWithRetry({
      contents: `Text k přeformulování:\n\n${text}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const result = response.text || "";
    res.json({ output: result.trim() });
  } catch (error: any) {
    console.error("Rephraser API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during rephrasing." });
  }
});

// 2. Prompt Optimizer agentic loop (smyčka)
app.post("/api/optimize-prompt", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt parameter" });
  }

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
    });
  }

  try {
    const steps: Array<{ title: string; content: string }> = [];

    // Step 1: Initial draft of optimized prompt
    const step1Response = await generateContentWithRetry({
      contents: `Target user basic prompt:\n"${prompt}"\n\nGenerate a highly structured, professional version of this prompt using markdown. Define Role/Persona, Context, Task details, Constraints, and Expected Output format. Do not add conversational intro.`,
      config: {
        systemInstruction: "You are an expert prompt engineer. Your job is to transform a basic prompt into a structured, highly effective instruction for advanced AI models.",
        temperature: 0.5,
      },
    });
    const draftPrompt = step1Response.text || "";
    steps.push({
      title: "1. Návrh optimalizovaného promptu",
      content: draftPrompt.trim(),
    });

    // Step 2: Agentic Critique Loop - Analysis of potential weak points
    const step2Response = await generateContentWithRetry({
      contents: `Draft Prompt:\n${draftPrompt}\n\nAnalyze this draft. Identify at least 2 potential points of ambiguity or gaps where a model might fail, misinterpret, or produce inaccurate outputs. List these specific issues in Czech in bullet points.`,
      config: {
        systemInstruction: "You are a critical reviewer of AI prompts. Analyze instructions to find logical loopholes, ambiguous boundaries, or lacking constraints.",
        temperature: 0.3,
      },
    });
    const critique = step2Response.text || "";
    steps.push({
      title: "2. Kritická analýza a detekce chyb (Kritik)",
      content: critique.trim(),
    });

    // Step 3: Self-Correction & Final refinement
    const step3Response = await generateContentWithRetry({
      contents: `Draft Prompt:\n${draftPrompt}\n\nCritique feedback:\n${critique}\n\nProduce the final optimized prompt by completely resolving the critique issues. Enhance the prompt with explicit negative constraints to avoid hallucinations. Output ONLY the final refined markdown prompt.`,
      config: {
        systemInstruction: "You are a master prompt engineering compiler. Your output should be a single, complete, polished markdown block of the optimized prompt, with all critique recommendations fully integrated.",
        temperature: 0.4,
      },
    });
    const finalPrompt = step3Response.text || "";
    steps.push({
      title: "3. Finální zpřesnění na základě kritiky",
      content: finalPrompt.trim(),
    });

    res.json({
      steps,
      optimizedPrompt: finalPrompt.trim(),
    });
  } catch (error: any) {
    console.error("Prompt Optimizer API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during prompt optimization." });
  }
});

// 3. Assertive Reply Generator (Odpovědi na zprávy s pozitivním dopadem)
app.post("/api/generate-assertive-reply", async (req, res) => {
  const { receivedMessage, toneStyle } = req.body;

  if (!receivedMessage || typeof receivedMessage !== "string") {
    return res.status(400).json({ error: "Missing or invalid receivedMessage parameter" });
  }

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
    });
  }

  try {
    let stylePrompt = "";
    if (toneStyle === "uncompromising") {
      stylePrompt = "Ledově klidný, absolutně nekompromisní, věcný a stanovující jasnou neprostupnou hranici. Druhá strana musí z tónu pochopit, že jakékoli další překračování hranic bude mít okamžité následky a že s vámi nelze manipulovat.";
    } else if (toneStyle === "confident") {
      stylePrompt = "Sebevědomý, diplomatický, s nadhledem (vysoký status). Tón je zdvořilý, ale krystalicky jasný, s lehkou dávkou asertivní ignorance vůči jejich manipulativnímu nátlaku.";
    } else {
      stylePrompt = "Úderný, přímočarý a maximálně stručný. Žádné zbytečné vysvětlování, omluvy nebo obhajoba vašich kroků. Jen čisté, asertivní sdělení vašeho stanoviska.";
    }

    const systemInstruction = 
      "Jste špičkový psychologický poradce a expert na asertivní komunikaci a ochranu osobních hranic. " +
      "Vaším úkolem je rozebrat příchozí zprávu a navrhnout pro uživatele takovou odpověď, " +
      "která má na uživatele silný POZITIVNÍ a posilující dopad (rebuilds self-worth, validates boundaries) a druhou stranu " +
      "přiměje pochopit, že si s uživatelem nemá zahrávat. " +
      "VÝSTUP MUSÍ MÍT PŘESNĚ TENTO FORMÁT V ČEŠTINĚ:\n\n" +
      "### 🧠 PSYCHOLOGICKÝ ROZBOR (Posílení pro Vás)\n" +
      "[Zde napište vřelý, posilující rozbor pro uživatele. Detekujte manipulaci, nátlak nebo pasivní agresi v doručené zprávě. Ukažte uživateli, proč je v právu a proč se nemusí cítit provinile. Zvedněte mu sebevědomí.]\n\n" +
      "### 🛡️ DOPORUČENÁ STRATEGIE\n" +
      "[Popište, jakou strategii v odpovědi zvolit a proč tato taktika na dotyčného zabere.]\n\n" +
      "### 💬 NAVRŽENÁ ODPOVĚĎ\n" +
      "[Zde vygenerujte samotnou zprávu, kterou uživatel může zkopírovat a odeslat. Musí být napsána přesně ve zvoleném stylu: " + stylePrompt + " Žádné uvozovky kolem, přímo text k odeslání.]";

    const response = await generateContentWithRetry({
      contents: `Příchozí zpráva od druhé strany:\n"${receivedMessage}"`,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    res.json({ output: response.text || "" });
  } catch (error: any) {
    console.error("Assertive Reply Generator API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during generating reply." });
  }
});

// 4. Intelligent Text Predictor & Continuation (Chytrá predikce textu)
app.post("/api/predict-text", async (req, res) => {
  const { text, contextStyle } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
    });
  }

  const cleanText = (text || "").trim();

  try {
    const systemInstruction = 
      "Jste pokročilý lingvistický asistent pro predikci a pokračování textu. " +
      "Uživatel začal psát text v češtině a vaším úkolem je navrhnout, jak by mohl text pokračovat. " +
      "VÝSTUP MUSÍ BÝT POUZE ČISTÝ A VALIDNÍ JSON (v žádném případě nepoužívejte ```json a ``` uvozovky, jen čistý JSON objekt), " +
      "který obsahuje přesně tyto dvě vlastnosti:\n" +
      "1. \"continuations\": pole 3 různých možných pokračování rozepsané myšlenky (každé o délce cca 3 až 12 slov). " +
      "Tato pokračování musí přirozeně a elegantně navazovat na rozepsaný text uživatele a doplňovat ho. " +
      "Pokud je styl nastaven na 'assertive', pište pokračování s vysokým asertivním statusem a ochranou hranic.\n" +
      "2. \"nextWords\": pole 4 až 5 nejvíce pravděpodobných bezprostředně následujících jednotlivých slov nebo krátkých spojení (1-2 slova), " +
      "kterými může uživatel pokračovat.\n\n" +
      "Pokud je vstupní text prázdný, navrhněte asertivní začátky a asertivní úvodní slova (např. 'Chci vám oznámit...', 'Rád bych vyjasnil...', 'Moje stanovisko...').\n\n" +
      "Odpovězte pouze ve formátu:\n" +
      "{\n" +
      "  \"continuations\": [\"návrh 1\", \"návrh 2\", \"návrh 3\"],\n" +
      "  \"nextWords\": [\"slovo1\", \"slovo2\", \"slovo3\", \"slovo4\"]\n" +
      "}";

    const response = await generateContentWithRetry({
      contents: `Rozepsaný text uživatele:\n"${cleanText}"\nStyl kontextu: ${contextStyle || 'standard'}`,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const rawText = response.text || "";
    // Clean potential markdown wrappers if returned
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (parseErr) {
      console.warn("Failed to parse JSON prediction:", rawText, parseErr);
      // Fallback response if JSON parsing fails
      res.json({
        continuations: [
          " ... beru na vědomí, ale trvám na svém původním rozhodnutí.",
          " ... v této záležitosti mám jasno a nebudu stanovisko měnit.",
          " ... navrhuji se vrátit k věcné diskusi bez osobních útoků."
        ],
        nextWords: ["beru", "trvám", "rozhodnutí", "stanovisko"]
      });
    }
  } catch (error: any) {
    console.error("Predictor API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during text prediction." });
  }
});

// 5. AI Self-Learning Term Extractor (Sebeučení aplikace)
app.post("/api/learn-terms", async (req, res) => {
  const { inputText, outputText, existingTerms } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
    });
  }

  try {
    const existingList = Array.isArray(existingTerms) ? existingTerms : [];
    const systemInstruction = 
      "Jste pokročilý lingvistický analytik, psycholog a pedagog. Vaším úkolem je analyzovat zadaný vstupní a výstupní text " +
      "a vyhledat v něm 1 až 2 zajímavé, sofistikované, odborné, asertivní nebo psychologické termíny v češtině, " +
      "které ještě nejsou v tomto seznamu známých slov: [" + existingList.join(", ") + "]. " +
      "Pro každý nově nalezený termín vytvořte slovníkovou definici v češtině. " +
      "VÝSTUP MUSÍ BÝT POUZE ČISTÝ A VALIDNÍ JSON POLE objektů (bez ```json a ``` uvozovek), kde každý objekt má strukturu:\n" +
      "{\n" +
      "  \"term\": \"Odborný termín (s velkým počátečním písmenem, např. 'Kognitivní disonance')\",\n" +
      "  \"simple\": \"Jednoduché srozumitelné vysvětlení významu pro laika v češtině\",\n" +
      "  \"english\": \"Anglický odborný ekvivalent\",\n" +
      "  \"category\": \"Zařazení do jedné z těchto kategorií: 'Mezilidské vztahy & Asertivita', 'IT & AI', 'Lékařství', 'Právo', 'Finance & Ekonomika', 'Filozofie'\",\n" +
      "  \"context\": \"Ukázková věta použití tohoto slova v praxi, vztahující se k tématu textu\",\n" +
      "  \"level3\": \"Hluboký expertní, vědecký nebo psychologický rozbor konceptu pro specialisty\"\n" +
      "}\n\n" +
      "Pokud v textu žádný vhodný nový termín nenajdete, vraťte prázdné pole []. Nebuďte příliš benevolentní, hledejte skutečně intelektuální, odborné nebo asertivní výrazy.";

    const response = await generateContentWithRetry({
      contents: `Vstupní text uživatele:\n"${inputText || ""}"\n\nVýstupní text / výsledek:\n"${outputText || ""}"`,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const rawText = response.text || "";
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      res.json({ learned: Array.isArray(parsed) ? parsed : [] });
    } catch (parseErr) {
      console.warn("Failed to parse JSON learned terms:", rawText, parseErr);
      res.json({ learned: [] });
    }
  } catch (error: any) {
    console.error("Learn terms API Error:", error);
    res.json({ learned: [] });
  }
});

// Serve frontend client-side SPA or Vite dev mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
