import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Shared Gemini Client with lazy initialization
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const authClient = (ai as any).apiClient?.clientOptions?.auth;
    if (authClient) {
      authClient.addAuthHeaders = async function (headers: any) {
        if (apiKey.startsWith("ya29.") || apiKey.startsWith("AQ.") || apiKey.startsWith("c23.")) {
          headers.set("Authorization", "Bearer " + apiKey);
          headers.delete("x-goog-api-key");
        } else {
          headers.set("x-goog-api-key", apiKey);
        }
      };
    }
  }
  return ai;
}

// Keep track of temporarily unhealthy models to avoid sluggish failover times
const modelHealthStatus: Record<string, number> = {};

// Helper function to call Gemini with retries and a fallback model to handle transient 503/rate-limit errors
async function generateContentWithRetry(params: {
  contents: string;
  config: {
    systemInstruction: string;
    temperature: number;
    responseMimeType?: string;
    responseSchema?: any;
  };
}) {
  const client = getGeminiClient();

  const now = Date.now();
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
  
  // Sort models: healthy ones first, then unhealthy ones
  const sortedModels = [...modelsToTry].sort((a, b) => {
    const aUnhealthyUntil = modelHealthStatus[a] || 0;
    const bUnhealthyUntil = modelHealthStatus[b] || 0;
    
    const aIsUnhealthy = now < aUnhealthyUntil;
    const bIsUnhealthy = now < bUnhealthyUntil;
    
    if (aIsUnhealthy && !bIsUnhealthy) return 1;
    if (!aIsUnhealthy && bIsUnhealthy) return -1;
    return 0;
  });

  let lastError: any = null;

  for (const model of sortedModels) {
    // Check if currently unhealthy - if so, only try it as an absolute last resort
    const isUnhealthy = now < (modelHealthStatus[model] || 0);
    if (isUnhealthy) {
      console.log(`[Gemini API] Bypassing ${model} initially because it is marked temporarily unhealthy/overloaded.`);
    }

    const maxAttempts = isUnhealthy ? 1 : 2; // only try once if it was marked unhealthy
    let succeeded = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${model} (Attempt ${attempt}/${maxAttempts})...`);
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        
        if (response && response.text) {
          succeeded = true;
          // Clear any unhealthy status if it succeeded!
          delete modelHealthStatus[model];
          return response;
        }
        throw new Error("Received empty response from model");
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || (typeof err === "string" ? err : JSON.stringify(err));
        console.log(`[Gemini API Info] Model ${model} failed on attempt ${attempt}:`, errMsg);
        
        // Immediately throw on authentication / permission errors to prevent wasteful retries
        const isAuthError = 
          err.status === "UNAUTHENTICATED" ||
          err.status === 401 ||
          err.statusCode === 401 ||
          errMsg.includes("API_KEY_SERVICE_BLOCKED") ||
          errMsg.includes("UNAUTHENTICATED") ||
          errMsg.includes("401") ||
          errMsg.includes("invalid authentication credentials") ||
          errMsg.includes("PERMISSION_DENIED");

        if (isAuthError) {
          console.log(`[Gemini API] Authentication error detected for API key. Aborting further model retries.`);
          throw err;
        }

        // Check if quota is exceeded (429 or RESOURCE_EXHAUSTED) or unavailable (503) to skip useless retries on this model
        const isQuotaOrUnavailable = 
          err.status === "RESOURCE_EXHAUSTED" || 
          err.status === "UNAVAILABLE" ||
          err.status === 429 || 
          err.status === 503 ||
          err.statusCode === 429 || 
          err.statusCode === 503 ||
          errMsg.toLowerCase().includes("quota") || 
          errMsg.toLowerCase().includes("429") ||
          errMsg.toLowerCase().includes("503") ||
          errMsg.toLowerCase().includes("rate limit") ||
          errMsg.toLowerCase().includes("unavailable") ||
          errMsg.toLowerCase().includes("high demand") ||
          errMsg.toLowerCase().includes("resource_exhausted");

        if (isQuotaOrUnavailable) {
          console.log(`[Gemini API] Quota/Unavailability exceeded for ${model}. Marking unhealthy and switching instantly to fallback...`);
          modelHealthStatus[model] = Date.now() + 3 * 60 * 1000; // mark unhealthy for 3 minutes
          break; // skip remaining attempts for this model
        }

        // Wait before retrying (exponential backoff) for transient errors like 503
        if (attempt < maxAttempts) {
          const delay = attempt * 1000; // 1s on first retry
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!succeeded) {
      // Mark unhealthy if both attempts failed
      modelHealthStatus[model] = Date.now() + 3 * 60 * 1000;
    }
  }

  throw lastError || new Error("All model fallback attempts failed.");
}

// Helper function to format Gemini API errors into friendly, clean Czech messages
function formatGeminiError(err: any): string {
  if (!err) return "Chyba při komunikaci s AI serverem.";
  
  let rawStr = "";
  if (typeof err === "string") {
    rawStr = err;
  } else if (err.message && typeof err.message === "string") {
    rawStr = err.message;
  } else {
    try {
      rawStr = JSON.stringify(err);
    } catch (_) {
      rawStr = String(err);
    }
  }

  // Check for authentication / key blocked errors
  if (
    rawStr.includes("API_KEY_SERVICE_BLOCKED") || 
    rawStr.includes("UNAUTHENTICATED") || 
    rawStr.includes("401") || 
    rawStr.includes("invalid authentication credentials") ||
    rawStr.includes("PERMISSION_DENIED")
  ) {
    return "Gemini API klíč v prostředí je neplatný nebo zablokován pro službu Generative Language API (Chyba 401 Unauthenticated). Prosím zkontrolujte nebo nastavte platný klíč GEMINI_API_KEY v Secrets panelu. Aplikace nyní používá lokální offline engine.";
  }

  if (rawStr.includes("RESOURCE_EXHAUSTED") || rawStr.includes("429") || rawStr.includes("quota")) {
    return "Byl překročen kvótový limit Gemini API (Chyba 429 Rate Limit). Zkuste to prosím za okamžik znovu.";
  }

  if (rawStr.includes("503") || rawStr.includes("UNAVAILABLE")) {
    return "Služba Gemini AI je momentálně přetížena (Chyba 503 Unavailable). Zkuste to za chvíli.";
  }

  // Extract message if rawStr contains embedded JSON
  try {
    const jsonMatch = rawStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        if (parsed.error.reason === "API_KEY_SERVICE_BLOCKED" || parsed.error.status === "UNAUTHENTICATED") {
          return "Gemini API klíč je neplatný nebo zablokován pro Generative Language API (Chyba 401 Unauthenticated). Vložte prosím nový klíč z https://aistudio.google.com/app/apikey do Secrets panelu.";
        }
        return parsed.error.message;
      }
    }
  } catch (_) {}

  return rawStr;
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

  try {
    getGeminiClient();
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
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
    res.status(500).json({ error: formatGeminiError(error) });
  }
});

// 3. Assertive Reply Generator (Odpovědi na zprávy s pozitivním dopadem)
app.post("/api/generate-assertive-reply", async (req, res) => {
  const { receivedMessage, toneStyle } = req.body;

  if (!receivedMessage || typeof receivedMessage !== "string") {
    return res.status(400).json({ error: "Missing or invalid receivedMessage parameter" });
  }

  try {
    getGeminiClient();
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
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
    res.status(500).json({ error: formatGeminiError(error) });
  }
});

// 4. Intelligent Text Predictor & Continuation (Chytrá predikce textu)
app.post("/api/predict-text", async (req, res) => {
  const { text, contextStyle } = req.body;

  try {
    getGeminiClient();
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
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
    res.status(500).json({ error: formatGeminiError(error) });
  }
});

// 5. AI Self-Learning Term Extractor (Sebeučení aplikace)
app.post("/api/learn-terms", async (req, res) => {
  const { inputText, outputText, existingTerms } = req.body;

  try {
    getGeminiClient();
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
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

// 6. Video Analyzer Endpoint (Analýza videa pomocí gemini-3.1-pro-preview)
app.post("/api/analyze-video", async (req, res) => {
  const { base64Video, mimeType, prompt } = req.body;

  if (!base64Video || typeof base64Video !== "string") {
    return res.status(400).json({ error: "Chybí nebo je neplatný parametr base64Video." });
  }

  let client;
  try {
    client = getGeminiClient();
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Gemini API is not configured on the server. Please configure GEMINI_API_KEY in the Secrets panel.",
    });
  }

  const tempFilePath = path.join(os.tmpdir(), `uploaded_video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp4`);
  let fileUploaded = false;
  let uploadResponse: any = null;

  try {
    // Write base64 string to a temporary local file
    const cleanBase64 = base64Video.includes("base64,") 
      ? base64Video.split("base64,")[1] 
      : base64Video;
      
    fs.writeFileSync(tempFilePath, Buffer.from(cleanBase64, "base64"));

    console.log(`[Video Analyzer] Uploading temporary video file to Gemini File API... (${tempFilePath})`);
    uploadResponse = await client.files.upload({
      file: tempFilePath,
      config: { mimeType: mimeType || "video/mp4" }
    });
    fileUploaded = true;
    console.log(`[Video Analyzer] Upload successful. Gemini File Name: ${uploadResponse.name}`);

    // Poll file status until it is ACTIVE
    let activeFile = await client.files.get({ name: uploadResponse.name });
    let attempts = 0;
    const maxAttempts = 40; // 40 * 2.5s = 100 seconds max polling time

    console.log(`[Video Analyzer] Polling video processing status for ${uploadResponse.name}...`);
    while (activeFile.state === "PROCESSING" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      activeFile = await client.files.get({ name: uploadResponse.name });
      attempts++;
      console.log(`[Video Analyzer] Attempt ${attempts}: state is ${activeFile.state}`);
    }

    if (activeFile.state !== "ACTIVE") {
      throw new Error(`Zpracování videa na serveru selhalo nebo vypršel časový limit (stav: ${activeFile.state}).`);
    }

    console.log(`[Video Analyzer] Video is ACTIVE. Querying gemini-3.1-pro-preview...`);
    const customPrompt = prompt || "Zanalizuj toto video a uveď klíčové informace, časové značky a celkové shrnutí v češtině.";

    const response = await client.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        activeFile,
        customPrompt
      ]
    });

    const outputText = response.text || "Nepodařilo se vygenerovat žádný výstup z analýzy videa.";
    console.log(`[Video Analyzer] Analysis successful!`);

    res.json({ output: outputText });

  } catch (error: any) {
    console.error("Video Analyzer API Error:", error);
    const errMsg = error.message || (typeof error === "string" ? error : JSON.stringify(error));
    
    // Check if error is unauthenticated/unauthorized to provide extremely helpful feedback
    let helpfulMsg = errMsg;
    if (errMsg.includes("UNAUTHENTICATED") || errMsg.includes("401") || errMsg.includes("403") || errMsg.includes("PERMISSION_DENIED") || errMsg.includes("API_KEY_SERVICE_BLOCKED") || errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
      helpfulMsg = 
        "Chyba ověření Gemini API (401/403). Zkontrolujte prosím konfiguraci API klíče v panelu Settings > Secrets.\n\n" +
        "DŮVOD: Váš současný API klíč začíná na 'AQ.Ab', což odpovídá dočasnému přihlašovacímu tokenu Google Cloud, " +
        "nikoli plnohodnotnému Gemini API klíči (který by měl začínat na 'AIzaSy').\n\n" +
        "JAK TO OPRAVIT:\n" +
        "1. Přejděte na https://aistudio.google.com/app/apikey a vygenerujte si bezplatný API klíč.\n" +
        "2. V levém dolním rohu tohoto prostředí klikněte na Settings (Ozubené kolečko) > Secrets.\n" +
        "3. Přidejte nebo upravte klíč s názvem 'GEMINI_API_KEY' a vložte svůj vygenerovaný klíč (začínající na 'AIzaSy').";
    }

    res.status(500).json({ error: helpfulMsg });

  } finally {
    // Cleanup files in all scenarios to prevent leaks
    if (fileUploaded && uploadResponse) {
      try {
        console.log(`[Video Analyzer] Cleaning up Gemini file: ${uploadResponse.name}`);
        await client.files.delete({ name: uploadResponse.name });
      } catch (delErr) {
        console.error("Failed to delete Gemini file in cleanup:", delErr);
      }
    }
    try {
      if (fs.existsSync(tempFilePath)) {
        console.log(`[Video Analyzer] Cleaning up local temp file: ${tempFilePath}`);
        fs.unlinkSync(tempFilePath);
      }
    } catch (delErr) {
      console.error("Failed to delete local temp file in cleanup:", delErr);
    }
  }
});

// 6. API Endpoint for Psychological Interrogation Evaluation (20 questions & riddles)
app.post("/api/evaluate-interrogation", async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Chybí odpovědi k vyhodnocení výslechu." });
    }

    const formattedAnswers = answers.map((a: any, index: number) => 
      `${index + 1}. [OTÁZKA/TEST]: ${a.question}\n   [ODPOVĚĎ/REAKCE]: ${a.answer || "Bez odpovědi"}`
    ).join("\n\n");

    const systemInstruction = `Jste mezinárodně uznávaný klinický psycholog, psychiatr a forenzní profilovač.
Vaším úkolem je na základě 20 sofistikovaných otázek, logických hádanek a chování zhodnotit psychologický profil testované osoby.

Odpovězte výhradně v čirém JSON formátu podle následující schémy:
{
  "primaryCategory": "Název hlavní kategorie osobnosti (např. Narcisticko-Grandiózní typ, Hraniční / Emočně-Nestabilní typ, Pasivně-Agresivní typ, Úzkostně-Paranoidní typ, Obsedantně-Kompulzivní typ, Histrionsko-Dramatický typ, Vyhýbavě-Introvertní typ, Racionálně-Analytický typ)",
  "secondaryCategory": "Název sekundární kategorie osobnosti",
  "summary": "Stručné shrnutí psychologického profilu (2-3 věty).",
  "psychiatricDiagnosis": "Detailní klinická analýza osobnosti z pohledu psychiatra (obranné mechanismy, kognitivní zkreslení, reakce na stres, zpracování emocí).",
  "traitScores": [
    {"trait": "Ego a Narcismus", "score": 85, "description": "Sklon k nadřazenosti nebo obraně ega"},
    {"trait": "Emoční stabilita", "score": 40, "description": "Míra reakce na stres a frustraci"},
    {"trait": "Pasivní agresivita", "score": 60, "description": "Skrytý odpor k autoritám a pravidlům"},
    {"trait": "Analytické myslení", "score": 90, "description": "Schopnost řešit logické hádanky a vzorce"},
    {"trait": "Paranoia a nedůvěra", "score": 50, "description": "Předpoklad zlého úmyslu u druhých"}
  ],
  "communicationDos": [
    "Doporučení 1 jak s osobou mluvit",
    "Doporučení 2 jak udržet klid"
  ],
  "communicationDonts": [
    "Co NIKDY nedělat (chyba 1)",
    "Co NIKDY nedělat (chyba 2)"
  ],
  "calmStrategy": "Klíčový psychologický přístup k deeskalaci napětí u tohoto člověka.",
  "detailedAnalysis": "Kompletní rozbor jednotlivých odpovídajících hádanek a dotazů."
}`;

    const promptText = `Vyhodnoťte následující výsledky psychologického výslechu / testu 20 otázek a hádanek:\n\n${formattedAnswers}`;

    const response = await generateContentWithRetry({
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const outputText = response.text || "";
    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(outputText);
    } catch (e) {
      const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    }

    res.json({ result: parsedJson });
  } catch (err: any) {
    console.error("Evaluate Interrogation API Error:", err);
    res.status(500).json({ error: formatGeminiError(err) });
  }
});

// 7. API Endpoint for Generating Calm De-escalating Responses for Personality Types
app.post("/api/generate-calm-response", async (req, res) => {
  try {
    const { statement, personalityType, psychiatristNotes, userQueryContext } = req.body;
    if (!statement) {
      return res.status(400).json({ error: "Chybí výpověď nebo dotaz k analýze." });
    }

    const systemInstruction = `Jste specializovaný psychiatrický AI asistent a terapeutický komunikátor.
Vaším úkolem je analyzovat co člověk řekl nebo jak odpovídá (i když si sám neuvědomuje své nevhodné či manipulativní chování) a navrhnout pro něj DOKONALOU, KLIDNOU A DEESKALAČNÍ ODPOVĚĎ, která ho udrží v klidu, nevyvolá obrannou reakci a zároveň jasně stanoví hranice.

Odpovězte výhradně v JSON formátu:
{
  "calmResponse": "Přesné znění odpovědi, kterou má uživatel dotyčnému člověku napsat nebo říct, aby zůstal úplně v klidu a spolupracoval.",
  "explanationOfStrategy": "Proč je tato odpověď psychologicky účinná a jak deeskaluje emoce daného typu osobnosti.",
  "psychologicalTriggersToAvoid": [
    "Triggery, kterým se v této konkrétní situaci vyhnout",
    "Slova, která nepoužívat"
  ],
  "underlyingUnconsciousNeed": "Co tento člověk ve skutečnosti podvědomě požaduje nebo čeho se bojí (i když si to neuvědomuje)."
}`;

    const promptText = `
Typ osobnosti dotyčného: ${personalityType || "Obecně náročný / Defenzivní typ"}
Psychiatrické poznámky / Profil: ${psychiatristNotes || "Nespecifikováno"}
Dodatečný kontext: ${userQueryContext || "Běžný rozhovor / konflikt"}

CO TENTO ČLOVĚK ŘEKL / JAK ODPOVĚDĚL:
"${statement}"

Navrhněte dokonalou deeskalační odpověď tak, aby byl člověk v klidu a vyhnuli jsme se všem konfliktům.`;

    const response = await generateContentWithRetry({
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const outputText = response.text || "";
    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(outputText);
    } catch (e) {
      const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    }

    res.json({ result: parsedJson });
  } catch (err: any) {
    console.error("Generate Calm Response API Error:", err);
    res.status(500).json({ error: formatGeminiError(err) });
  }
});

// 8. API Endpoint for Communication Training Simulation Step Evaluation
app.post("/api/evaluate-simulation-step", async (req, res) => {
  try {
    const { 
      personalityType, 
      psychiatristNotes, 
      scenarioTitle, 
      scenarioDescription, 
      currentTensionLevel, 
      personaStatement, 
      userResponse 
    } = req.body;

    if (!userResponse || !personaStatement) {
      return res.status(400).json({ error: "Chybí odpověď uživatele nebo výpověď simulované osobnosti." });
    }

    const systemInstruction = `Jste expert na krizovou komunikaci, deeskalaci konfliktů a klinickou psychologii.
Aplikujete simulátor komunikace s vybraným typem osobnosti (${personalityType || "Náročný klient/partner"}).

Vaším úkolem je vyhodnotit reakci uživatele na výpověď osobnosti v dané modelové situaci.
Určete:
1. "outcome": zda uživatel odpovídal správně a deeskaloval situaci ("calmed"), reagoval neutrálně ("neutral"), nebo osobnost ještě více rozzuřil/eskaloval ("infuriated").
2. "newTensionLevel": nové procento napětí/vzteku osobnosti (0 až 100, kde 0 je absolutní klid, 100 je totální afekt/kolaps). Vypočítejte na základě starého napětí (${currentTensionLevel || 50}).
3. "personaCounterResponse": dramatická a realistická odpověď simulované osobnosti na uživatelovu reakci v přímé řeči v češtině (pokud se rozzuřila, reaguje popudlivě/agresivně; pokud se uklidnila, reaguje smířlivěji/konstruktivně).
4. "evaluationText": stručné zhodnocení, co uživatel ve své odpovědi udělal dobře či špatně.
5. "idealResponse": přesné znění formulace, jak MĚL uživatel ideálně odpovídat pro nejlepší deeskalační účinek.
6. "explanationWhy": podrobné psychologické vysvětlení, PROČ tato ideální odpověď funguje na daný typ osobnosti a jakým emotivním triggerům předchází.

Odpovězte VÝHRADNĚ ve formátu JSON podle tohoto schématu:
{
  "outcome": "calmed" | "neutral" | "infuriated",
  "newTensionLevel": number,
  "personaCounterResponse": "Reakce osobnosti na odpověď uživatele...",
  "evaluationText": "Hodnocení uživatelovy odpovědi...",
  "idealResponse": "Správná / ideální deeskalační odpověď...",
  "explanationWhy": "Vysvětlení proč tato ideální odpověď deeskaluje a co se v psychice osobnosti odehrává..."
}`;

    const promptText = `
TYP OSOBNOSTI: ${personalityType}
PROFIL / POZNÁMKY PSYCHIATRA: ${psychiatristNotes || "Standardní profil"}
SITUACE: ${scenarioTitle} - ${scenarioDescription}
AKTUÁLNÍ NAPĚTÍ / MÍRA VZTEKU: ${currentTensionLevel || 50}%

CO ŘEKLA OSOBNOST UŽIVATELI:
"${personaStatement}"

ODPOVĚĎ UŽIVATELE (UŽIVATEL NAPSAL / ŘEKL):
"${userResponse}"

Vyhodnoťte uživatelovu odpověď, určete zda ji osobnost přijala nebo ji víc rozzuřila, vypočítejte nové napětí a vygenerujte další repliku osobnosti + ideální odpověď a odůvodnění.`;

    const response = await generateContentWithRetry({
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });

    const outputText = response.text || "";
    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(outputText);
    } catch (e) {
      const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    }

    res.json({ result: parsedJson });
  } catch (err: any) {
    console.error("Evaluate Simulation Step API Error:", err);
    res.status(500).json({ error: formatGeminiError(err) });
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
