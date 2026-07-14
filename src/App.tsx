/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Lock, 
  Unlock, 
  FileText, 
  Cpu, 
  Download, 
  Share2, 
  Trash2, 
  Plus, 
  Check, 
  Sparkles, 
  RefreshCw, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  Key, 
  ChevronRight, 
  FileDown, 
  Search,
  Globe,
  WifiOff,
  Copy,
  MessageSquare,
  Shield,
  Sun,
  Moon,
  Brain
} from "lucide-react";
import { OFFLINE_DICTIONARY, AUTOCOMPLETE_VOCABULARY, TermEntry } from "./data";
import { encryptText, decryptText } from "./utils/crypto";

// Type definitions for stored encrypted entries
interface EncryptedHistoryEntry {
  id: string;
  timestamp: string;
  title: string;
  ciphertext: string;
  salt: string;
  iv: string;
}

interface DecryptedHistoryEntry {
  id: string;
  timestamp: string;
  title: string;
  text: string;
}

export default function App() {
  // App navigation state
  const [activeTab, setActiveTab] = useState<"rephrase" | "prompt" | "dictionary" | "explain" | "reply">("rephrase");
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem("lexiflow_theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lexiflow_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lexiflow_theme", "light");
    }
  }, [isDarkMode]);

  // Self-learning State
  const [learnedWords, setLearnedWords] = useState<TermEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("lexiflow_learned_words");
    return stored ? JSON.parse(stored) : [];
  });

  const [learningStatus, setLearningStatus] = useState<string | null>(null);
  const [isLearning, setIsLearning] = useState<boolean>(false);

  // Pool of terms to learn from offline heuristically
  const OFFLINE_LEARNABLE_POOL = [
    {
      term: "Paradigma",
      simple: "obecně přijímané schéma myšlení, ucelený soubor názorů či model věcí",
      english: "Paradigm",
      category: "Filozofie",
      context: "Nové vědecké objevy často způsobí změnu celého myšlenkového paradigmatu.",
      level3: "Epistemologický model reprezentující soubor teoretických předpokladů, metodologických zásad a praktických řešení sdílených vědeckou komunitou v určitém období."
    },
    {
      term: "Kognice",
      simple: "poznávací procesy a schopnosti lidské mysli, jako je vnímání, paměť, myšlení a učení",
      english: "Cognition",
      category: "Mezilidské vztahy & Asertivita",
      context: "S věkem se naše kognice vyvíjí a přizpůsobuje novým životním situacím.",
      level3: "Souhrn neuropsychologických procesů zaměřených na recepci, zpracování, ukládání a transformaci senzorických informací v lidském mozku."
    },
    {
      term: "Synergie",
      simple: "společné působení několika prvků, které přináší větší výsledek než prostý součet jejich jednotlivých částí (1+1=3)",
      english: "Synergy",
      category: "Finance & Ekonomika",
      context: "Spojením našich týmů vznikla silná synergie, která urychlila vývoj projektu.",
      level3: "Kooperativní interakce dvou či více autonomních činitelů, u níž celkový emergentní efekt převyšuje prostou aditivní sumu individuálních příspěvků."
    },
    {
      term: "Dichotomie",
      simple: "rozdělení celku do dvou protikladných, vzájemně se vylučujících částí (např. černá vs. bílá)",
      english: "Dichotomy",
      category: "Filozofie",
      context: "Dichotomie mezi asertivitou a agresivitou je v komunikaci klíčová.",
      level3: "Bifurkace diskursivního univerza na dvě komplementární a disjunktní třídy, které se vzájemně exkludují a nevykazují žádný překryv."
    },
    {
      term: "Heuristika",
      simple: "zjednodušená myšlenková zkratka nebo neformální metoda řešení problémů, která šetří čas, i když nemusí být 100% přesná",
      english: "Heuristics",
      category: "IT & AI",
      context: "Při rychlém rozhodování se naše mysl často spoléhá na intuitivní heuristiky.",
      level3: "Kognitivní strategie snižující výpočetní náročnost rozhodování v podmínkách informační asymetrie a časového deficitu pomocí aproximací."
    },
    {
      term: "Axiom",
      simple: "základní tvrzení, které se považuje za pravdivé a nedokazuje se, protože slouží jako výchozí bod pro další logické úvahy",
      english: "Axiom",
      category: "Filozofie",
      context: "Respekt k osobním hranicím druhých je základním axiomem zdravé komunikace.",
      level3: "Fundamentální propozice formálního systému, která je přijímána jako validní bez apriorního důkazu a tvoří bází pro deduktivní odvození dalších teorémů."
    }
  ];

  // Self-learning triggers
  const triggerSelfLearning = async (inputVal: string, outputVal: string) => {
    if (!inputVal || !outputVal) return;
    
    if (!isOnline) {
      // Offline learning heuristic
      const fullText = (inputVal + " " + outputVal).toLowerCase();
      const newlyLearned: TermEntry[] = [];
      
      OFFLINE_LEARNABLE_POOL.forEach(item => {
        const alreadyExists = OFFLINE_DICTIONARY.some(d => d.term.toLowerCase() === item.term.toLowerCase()) || 
                              learnedWords.some(lw => lw.term.toLowerCase() === item.term.toLowerCase());
                              
        if (!alreadyExists && fullText.includes(item.term.toLowerCase())) {
          newlyLearned.push({
            id: `learned-off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...item,
            category: item.category
          });
        }
      });
      
      if (newlyLearned.length > 0) {
        setLearnedWords(prev => {
          const updated = [...newlyLearned, ...prev];
          localStorage.setItem("lexiflow_learned_words", JSON.stringify(updated));
          return updated;
        });
        setLearningStatus(`Aplikace se offline naučila nový výraz: ${newlyLearned.map(x => x.term).join(", ")}!`);
        setTimeout(() => setLearningStatus(null), 5000);
      }
      return;
    }
    
    // Online learning
    try {
      setIsLearning(true);
      const existingTermsList = [
        ...OFFLINE_DICTIONARY.map(d => d.term),
        ...learnedWords.map(w => w.term)
      ];
      
      const res = await fetch("/api/learn-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: inputVal,
          outputText: outputVal,
          existingTerms: existingTermsList
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.learned && data.learned.length > 0) {
          const freshLearned = data.learned.map((item: any) => ({
            id: `learned-on-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...item,
            category: item.category || "Sebeučení"
          }));
          
          setLearnedWords(prev => {
            const updated = [...freshLearned, ...prev];
            localStorage.setItem("lexiflow_learned_words", JSON.stringify(updated));
            return updated;
          });
          setLearningStatus(`Aplikace se automaticky naučila nový výraz: ${freshLearned.map((x: any) => x.term).join(", ")}!`);
          setTimeout(() => setLearningStatus(null), 5000);
        }
      }
    } catch (e) {
      console.error("Self-learning fetch error:", e);
    } finally {
      setIsLearning(false);
    }
  };

  // Text Rephraser State
  const [inputText, setInputText] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [rephraseOutput, setRephraseOutput] = useState<string>("");
  const [isRephrasing, setIsRephrasing] = useState<boolean>(false);
  const [rephraseError, setRephraseError] = useState<string | null>(null);

  // Message Reply State (Asertivní odpovědi)
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [toneStyle, setToneStyle] = useState<"uncompromising" | "confident" | "direct">("uncompromising");
  const [replyOutput, setReplyOutput] = useState<string>("");
  const [isGeneratingReply, setIsGeneratingReply] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Dictionary search in App
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDictCategory, setSelectedDictCategory] = useState<string>("Všechny");

  // Custom added / manual learning dictionary form state
  const [newTerm, setNewTerm] = useState("");
  const [newSimple, setNewSimple] = useState("");
  const [newEnglish, setNewEnglish] = useState("");
  const [newCategory, setNewCategory] = useState("Mezilidské vztahy & Asertivita");
  const [newContext, setNewContext] = useState("");
  const [newLevel3, setNewLevel3] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addTermStatus, setAddTermStatus] = useState<string | null>(null);

  const handleAddCustomTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newSimple.trim()) {
      setAddTermStatus("⚠️ Název výrazu a srozumitelný význam jsou povinné.");
      return;
    }

    const duplicate = OFFLINE_DICTIONARY.some(d => d.term.toLowerCase() === newTerm.trim().toLowerCase()) ||
                      learnedWords.some(lw => lw.term.toLowerCase() === newTerm.trim().toLowerCase());

    if (duplicate) {
      setAddTermStatus("⚠️ Tento výraz již ve slovníku existuje.");
      return;
    }

    const newEntry: TermEntry = {
      id: `custom-added-${Date.now()}`,
      term: newTerm.trim(),
      simple: newSimple.trim(),
      english: newEnglish.trim() || "N/A",
      category: newCategory,
      context: newContext.trim() || "Příkladová věta nebyla zadána.",
      level3: newLevel3.trim() || "Detailní akademická specifikace nebyla zadána."
    };

    const updated = [newEntry, ...learnedWords];
    setLearnedWords(updated);
    localStorage.setItem("lexiflow_learned_words", JSON.stringify(updated));

    // Reset form fields
    setNewTerm("");
    setNewSimple("");
    setNewEnglish("");
    setNewCategory("Mezilidské vztahy & Asertivita");
    setNewContext("");
    setNewLevel3("");
    setAddTermStatus("🎉 Výraz byl úspěšně uložen do slovníku sebeučení!");
    setTimeout(() => setAddTermStatus(null), 4000);
  };

  const handleDeleteLearnedWord = (id: string) => {
    const updated = learnedWords.filter(lw => lw.id !== id);
    setLearnedWords(updated);
    localStorage.setItem("lexiflow_learned_words", JSON.stringify(updated));
  };

  // Prompt Optimizer State
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [optimizerSteps, setOptimizerSteps] = useState<Array<{ title: string; content: string }>>([]);
  const [finalOptimizedPrompt, setFinalOptimizedPrompt] = useState<string>("");
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  
  // Encryption & Local storage state
  const [historyPassword, setHistoryPassword] = useState<string>("");
  const [isHistoryLocked, setIsHistoryLocked] = useState<boolean>(true);
  const [encryptedHistory, setEncryptedHistory] = useState<EncryptedHistoryEntry[]>([]);
  const [decryptedHistory, setDecryptedHistory] = useState<DecryptedHistoryEntry[]>([]);
  const [encryptStatusMsg, setEncryptStatusMsg] = useState<string | null>(null);

  // Predictive autocomplete state
  const [prediction, setPrediction] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Predictor state (for the prediction page)
  const [predictionInputText, setPredictionInputText] = useState<string>("");
  const [predictionStyle, setPredictionStyle] = useState<"standard" | "assertive" | "confident">("assertive");
  const [predictionContinuations, setPredictionContinuations] = useState<string[]>([]);
  const [predictionNextWords, setPredictionNextWords] = useState<string[]>([]);
  const [isPredictingText, setIsPredictingText] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Copy/Share status highlights
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);

  // 1. Monitor online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Load initially configured hash state if shared link is clicked
  useEffect(() => {
    try {
      if (window.location.hash) {
        const hashContent = window.location.hash.substring(1);
        const decoded = JSON.parse(atob(hashContent));
        if (decoded.text) setInputText(decoded.text);
        if (decoded.level) setSelectedLevel(decoded.level as 1 | 2 | 3);
        if (decoded.tab) setActiveTab(decoded.tab);
        if (decoded.prompt) setInputPrompt(decoded.prompt);
        if (decoded.receivedMessage) setReceivedMessage(decoded.receivedMessage);
        if (decoded.toneStyle) setToneStyle(decoded.toneStyle);
        // Clear hash after loading to keep it clean
        window.location.hash = "";
      }
    } catch (e) {
      console.error("Failed to parse shared state from URL hash:", e);
    }
  }, []);

  // 3. Load encrypted history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("lexiflow_encrypted_history");
    if (stored) {
      try {
        setEncryptedHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored encrypted history", e);
      }
    }
  }, []);

  // Sync encrypted history to localStorage
  const saveEncryptedToLocalStorage = (newHistory: EncryptedHistoryEntry[]) => {
    setEncryptedHistory(newHistory);
    localStorage.setItem("lexiflow_encrypted_history", JSON.stringify(newHistory));
  };

  // 4. Predictive engine helper
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!value) {
      setPrediction("");
      return;
    }

    // Get the word currently being typed at the very end of input
    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (!lastWord || lastWord.length < 2) {
      setPrediction("");
      return;
    }

    // Find first autocomplete matching word in Czech dictionary
    const match = AUTOCOMPLETE_VOCABULARY.find(term => 
      term.toLowerCase().startsWith(lastWord.toLowerCase()) && 
      term.toLowerCase() !== lastWord.toLowerCase()
    );

    if (match) {
      // Return the remainder of the matched word
      const suffix = match.slice(lastWord.length);
      setPrediction(suffix);
    } else {
      setPrediction("");
    }
  };

  // Intercept Tab / ArrowRight key to accept predictive ghost suggestion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && prediction) {
      e.preventDefault();
      setInputText(prev => prev + prediction + " ");
      setPrediction("");
    }
  };

  // 5. Offline Translator & Rephraser implementation (dictionary fall-back)
  const runOfflineRephrase = (text: string, level: 1 | 2 | 3, reverse: boolean): string => {
    let resultText = "";
    
    // Find terms present in the text to build a highlighted dictionary reference
    const foundTerms = OFFLINE_DICTIONARY.filter(entry => 
      text.toLowerCase().includes(entry.term.toLowerCase()) ||
      text.toLowerCase().includes(entry.simple.toLowerCase())
    );

    if (reverse) {
      // Reverse translation: replace expert terms with simplified equivalents
      let currentText = text;
      let replacedCount = 0;

      foundTerms.forEach(entry => {
        // Build regex for safe replacement
        const regex = new RegExp(entry.term, "gi");
        if (regex.test(currentText)) {
          currentText = currentText.replace(regex, `${entry.simple} (${entry.term})`);
          replacedCount++;
        }
      });

      if (replacedCount > 0) {
        resultText = `[Slovníkový offline režim - Zjednodušeno]\n\n${currentText}\n\n--- Metainformace ---\nNalezeno a zjednodušeno ${replacedCount} odborných výrazů pomocí lokální offline databáze.`;
      } else {
        resultText = `[Slovníkový offline režim]\n\nVložený text neobsahuje známé odborné výrazy z offline balíčku.\nZde je pokus o zjednodušení struktury souvětí:\n\n${text.split(/[.!?]+/).map(sentence => sentence.trim()).filter(Boolean).map(s => `• ${s}`).join("\n")}`;
      }
    } else {
      // Rephrase into Levels 1, 2, 3
      let textWithHighlights = text;
      
      foundTerms.forEach(entry => {
        const regex = new RegExp(entry.term, "gi");
        textWithHighlights = textWithHighlights.replace(regex, `**${entry.term.toUpperCase()}**`);
      });

      if (level === 1) {
        resultText = `[Offline analýza - Úroveň 1 (Srozumitelná s pár odbornými výrazy)]\n\n${textWithHighlights}\n\n📍 Offline doporučení pro nalezené pojmy:\n` +
          foundTerms.map(t => `- **${t.term}** (${t.english}): ${t.simple}. Vhodné pro běžného čtenáře.`).join("\n");
      } else if (level === 2) {
        resultText = `[Offline analýza - Úroveň 2 (Vzdělaní lidé, vyšší abstrakce)]\n\nVyšší kontextuální integrace témat. \n\n📍 Odborné definice pro nalezené pojmy:\n` +
          foundTerms.map(t => `- **${t.term}**: ${t.level3.substring(0, 100)}... (Anglicky: ${t.english}). Vyžaduje pokročilé systémové pochopení.`).join("\n");
      } else {
        resultText = `[Offline analýza - Úroveň 3 (Expertní vědecká analýza)]\n\nStrukturované teoretické vyhodnocení textu:\n\n` +
          foundTerms.map(t => `🔬 EXPERTNÍ SPECIFIKACE PRO: ${t.term.toUpperCase()}\n- Koncept: ${t.level3}\n- Kontext užití: "${t.context}"\n- Akademické označení: ${t.english}`).join("\n\n");
      }

      if (foundTerms.length === 0) {
        resultText += `\n(Upozornění: V textu nebyly nalezeny specifické výrazy z integrovaného offline balíčku s ${OFFLINE_DICTIONARY.length} výrazy. Zkuste použít slova jako: "umělá neuronová síť", "strojové učení", "epistemologie", "fiduciární povinnost" nebo se připojit online pro plný generativní model.)`;
      }
    }

    return resultText;
  };

  // Trigger Rephrase Action (Online API with offline fallback)
  const handleRephrase = async () => {
    if (!inputText.trim()) return;

    setIsRephrasing(true);
    setRephraseError(null);

    if (!isOnline) {
      // Offline mode uses custom high-fidelity dictionary translation
      setTimeout(() => {
        const result = runOfflineRephrase(inputText, selectedLevel, isReverse);
        setRephraseOutput(result);
        triggerSelfLearning(inputText, result);
        setIsRephrasing(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch("/api/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          level: selectedLevel,
          reverse: isReverse
        })
      });

      if (!response.ok) {
        throw new Error("Chyba při komunikaci se serverem.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setRephraseOutput(data.output);
      triggerSelfLearning(inputText, data.output);
    } catch (err: any) {
      console.error(err);
      setRephraseError(err.message || "Nepodařilo se dokončit analýzu textu. Používám lokální offline režim.");
      // Fallback to offline on server error
      const fallback = runOfflineRephrase(inputText, selectedLevel, isReverse);
      setRephraseOutput(fallback);
    } finally {
      setIsRephrasing(false);
    }
  };

  // Offline Assertive Reply Generator fallback (Ochranný asistent)
  const runOfflineAssertiveReply = (message: string, style: "uncompromising" | "confident" | "direct"): string => {
    const cleanMsg = message.toLowerCase();
    let analysis = "";
    let strategy = "";
    let reply = "";

    // Detect patterns in the message
    const hasPressure = cleanMsg.includes("musíš") || cleanMsg.includes("okamžitě") || cleanMsg.includes("hned") || cleanMsg.includes("rychle") || cleanMsg.includes("povinnost");
    const hasGuilt = cleanMsg.includes("vina") || cleanMsg.includes("zklamal") || cleanMsg.includes("proč jsi") || cleanMsg.includes("nemáš") || cleanMsg.includes("kvůli tobě");
    const hasBoundaryViolation = cleanMsg.includes("nechápu") || cleanMsg.includes("jak si můžeš") || cleanMsg.includes("drzost") || cleanMsg.includes("vždycky") || cleanMsg.includes("nikdy");

    if (hasPressure) {
      analysis = "Tato zpráva na vás vyvíjí nepřiměřený nátlak a snaží se vás donutit k okamžité reakci bez ohledu na vaše vlastní priority. Jedná se o běžný způsob manipulace s časovou tísní. Pamatujte, že máte plné právo určit si vlastní tempo a nenechat se tlačit do kouta.";
      strategy = "Strategií je zpomalit tempo komunikace a ukázat, že nátlak na vás nefunguje. Tím přebíráte kontrolu nad situací zpět do svých rukou.";
    } else if (hasGuilt) {
      analysis = "Odesílatel se vás snaží vmanipulovat do pocitu viny a obhajoby. Chce, abyste se cítili provinile a v důsledku toho ustoupili z vašich standardů. Je nesmírně důležité se nezačít obhajovat ani omlouvat, protože tím byste potvrdili jejich fiktivní obvinění.";
      strategy = "Zvolte taktiku ignorování citového vydírání a věcného vytyčení pevných hranic bez omluv a vysvětlování.";
    } else if (hasBoundaryViolation) {
      analysis = "Zpráva vykazuje známky nerespektování vašich hranic, generalizace (slova jako 'vždycky' či 'nikdy') a možného gaslightingu. Dotyčný se snaží zpochybnit vaše kompetence či legitimitu vašeho rozhodnutí.";
      strategy = "Dejte jasně najevo, že o svých hranicích nehodláte diskutovat a že diskuse je uzavřená. Reagujte klidně a s absolutní převahou.";
    } else {
      analysis = "Doručená zpráva se snaží narušit vaši osobní pohodu a otestovat pevnost vašich hranic. Druhá strana zkouší, co všechno si k vám může dovolit. Je skvělé, že se rozhodujete reagovat asertivně a nenechat se zatáhnout do jejich hry.";
      strategy = "Ukažte zdravou lhostejnost a pevný postoj. Nedovolte oponentovi diktovat pravidla hry.";
    }

    // Generate response based on style
    if (style === "uncompromising") {
      reply = "Vaši zprávu beru na vědomí, nicméně moje stanovisko v této věci je pevně dané a nebudu ho měnit. Další diskuse na toto téma je bezpředmětná a nebudu na ni reagovat. Očekávám, že toto rozhodnutí budete plně respektovat.";
    } else if (style === "confident") {
      reply = "Děkuji za váš názor. V této záležitosti jsem si však již ujasnil své priority a mé rozhodnutí zůstává v platnosti. Věřím, že můžeme pokračovat s plným respektem k nastaveným pravidlům.";
    } else {
      reply = "Beru vaše vyjádření na vědomí, ale trvám na svém původním rozhodnutí. Záležitost považuji z mé strany za uzavřenou.";
    }

    return `### 🧠 PSYCHOLOGICKÝ ROZBOR (Posílení pro Vás) [Offline Režim]\n${analysis}\n\n### 🛡️ DOPORUČENÁ STRATEGIE\n${strategy}\n\n### 💬 NAVRŽENÁ ODPOVĚD\n${reply}`;
  };

  // Trigger Assertive Reply Action
  const handleGenerateReply = async () => {
    if (!receivedMessage.trim()) return;

    setIsGeneratingReply(true);
    setReplyError(null);

    if (!isOnline) {
      // Local/Offline generative fallback
      setTimeout(() => {
        const result = runOfflineAssertiveReply(receivedMessage, toneStyle);
        setReplyOutput(result);
        triggerSelfLearning(receivedMessage, result);
        setIsGeneratingReply(false);
      }, 700);
      return;
    }

    try {
      const response = await fetch("/api/generate-assertive-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivedMessage,
          toneStyle
        })
      });

      if (!response.ok) {
        throw new Error("Chyba při komunikaci se serverem.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReplyOutput(data.output);
      triggerSelfLearning(receivedMessage, data.output);
    } catch (err: any) {
      console.error(err);
      setReplyError(err.message || "Nepodařilo se připojit k online asistentovi. Používám lokální asertivní analýzu.");
      const fallback = runOfflineAssertiveReply(receivedMessage, toneStyle);
      setReplyOutput(fallback);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // 6. Prompt Optimizer Action
  const handleOptimizePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsOptimizing(true);
    setOptimizerError(null);
    setOptimizerSteps([]);

    if (!isOnline) {
      // Local/Offline prompt optimizer: applies systematic engineering template rules
      setTimeout(() => {
        const ruleSteps = [
          {
            title: "1. Analýza záměru (Lokální syntaktický parser)",
            content: `Vstupní hrubé zadání: "${inputPrompt}"\n\nIdentifikovaný cíl: Automatizace práce, zpřesnění generování obsahu.`
          },
          {
            title: "2. Lokální smyčka se zpětnou vazbou (Kritika)",
            content: `Upozornění: Chybí vymezení role AI, negativní omezení a šablona pro výstupní formát.\nAutomaticky vkládám ochranná pravidla pro omezení halucinací a formátovací pravidla.`
          },
          {
            title: "3. Výstupní optimalizovaný prompt (Smyčkový kompilátor)",
            content: `# ROLE\nJste specializovaný asistent zaměřený na přesné zpracování požadavku: "${inputPrompt}"\n\n# KONTEXT\nUživatel požaduje bezchybné vypracování s důrazem na logickou konzistenci.\n\n# KROKOVÁ SMYČKA PRO AUTOMATICKÉ DOKONČENÍ\n1. KROK: Proveďte úvodní draft řešení.\n2. KROK: Zkontrolujte výstup proti zadaným omezením.\n3. KROK: Pokud naleznete chybu, opravte ji a teprve poté vygenerujte konečný výsledek.\n\n# OMEZENÍ\n- Nikdy si nevymýšlejte nepodložená fakta.\n- Pište přímo k věci, bez zbytečné omáčke.`
          }
        ];
        setOptimizerSteps(ruleSteps);
        setFinalOptimizedPrompt(ruleSteps[2].content);
        triggerSelfLearning(inputPrompt, ruleSteps[2].content);
        setIsOptimizing(false);
      }, 850);
      return;
    }

    try {
      const response = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputPrompt })
      });

      if (!response.ok) {
        throw new Error("Chyba při komunikaci se serverem.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setOptimizerSteps(data.steps || []);
      setFinalOptimizedPrompt(data.optimizedPrompt || "");
      triggerSelfLearning(inputPrompt, data.optimizedPrompt || "");
    } catch (err: any) {
      console.error(err);
      setOptimizerError(err.message || "Nepodařilo se spustit vzdálenou optimalizační smyčku. Spouštím offline kompilátor.");
      // Fallback to local rules
      const ruleSteps = [
        {
          title: "1. Analýza záměru (Lokální syntaktický parser)",
          content: `Vstupní hrubé zadání: "${inputPrompt}"\n\nIdentifikovaný cíl: Automatizace práce, zpřesnění generování obsahu.`
        },
        {
          title: "2. Lokální smyčka se zpětnou vazbou (Kritika)",
          content: `Upozornění: Chybí vymezení role AI, negativní omezení a šablona pro výstupní formát.\nAutomaticky vkládám ochranná pravidla pro omezení halucinací a formátovací pravidla.`
        },
        {
          title: "3. Výstupní optimalizovaný prompt (Smyčkový kompilátor)",
          content: `# ROLE\nJste specializovaný asistent zaměřený na přesné zpracování požadavku: "${inputPrompt}"\n\n# KONTEXT\nUživatel požaduje bezchybné vypracování s důrazem na logickou konzistenci.\n\n# KROKOVÁ SMYČKA PRO AUTOMATICKÉ DOKONČENÍ\n1. KROK: Proveďte úvodní draft řešení.\n2. KROK: Zkontrolujte výstup proti zadaným omezením.\n3. KROK: Pokud naleznete chybu, opravte ji a teprve poté vygenerujte konečný výsledek.\n\n# OMEZENÍ\n- Nikdy si nevymýšlejte nepodložená fakta.\n- Pište přímo k věci, bez zbytečné omáčky.`
        }
      ];
      setOptimizerSteps(ruleSteps);
      setFinalOptimizedPrompt(ruleSteps[2].content);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 10. Intelligent Text Predictor Action (targeting Gemini with offline fallback)
  const handlePredictText = async (textToPredict: string, style: "standard" | "assertive" | "confident") => {
    setIsPredictingText(true);
    setPredictionError(null);

    if (!isOnline) {
      // Offline fallback: match against local dictionary and autocomplete vocabulary
      setTimeout(() => {
        const lower = textToPredict.toLowerCase().trim();
        const words = lower.split(/\s+/);
        const lastWord = words[words.length - 1] || "";
        
        // Find matching offline words
        const matchedWords = AUTOCOMPLETE_VOCABULARY.filter(w => w.startsWith(lastWord) && w !== lastWord).slice(0, 4);
        
        // Form realistic sentences
        let offlineContinuations: string[] = [];
        if (style === "assertive") {
          offlineContinuations = [
            " ... beru na vědomí, ale trvám na svém původním stanovisku.",
            " ... v této záležitosti nehodlám dělat žádné kompromisy.",
            " ... očekávám, že moje osobní hranice budou plně respektovány."
          ];
        } else if (style === "confident") {
          offlineContinuations = [
            " ... děkuji za názor, nicméně mé priority jsou již pevně nastavené.",
            " ... věřím, že v této komunikaci zachováme profesionální nadhled.",
            " ... toto rozhodnutí je konečné a přináší nejlepší možný výsledek."
          ];
        } else {
          offlineContinuations = [
            " ... navrhuji se v této věci držet čistě faktických informací.",
            " ... rád se k této záležitosti vyjádřím podrobněji příští týden.",
            " ... pojďme najít řešení, které bude oboustranně výhodné."
          ];
        }

        setPredictionContinuations(offlineContinuations);
        setPredictionNextWords(matchedWords.length > 0 ? matchedWords : ["stanovisko", "respekt", "hranice", "rozhodnutí"]);
        triggerSelfLearning(textToPredict, offlineContinuations.join(" "));
        setIsPredictingText(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch("/api/predict-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToPredict,
          contextStyle: style
        })
      });

      if (!response.ok) {
        throw new Error("Chyba při komunikaci se serverem pro predikci.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setPredictionContinuations(data.continuations || []);
      setPredictionNextWords(data.nextWords || []);
      triggerSelfLearning(textToPredict, (data.continuations || []).join(" "));
    } catch (err: any) {
      console.error(err);
      setPredictionError("Nepodařilo se připojit k online prediktoru. Používám lokální asertivní predikci.");
      // Fallback
      const offlineWords = AUTOCOMPLETE_VOCABULARY.slice(0, 4);
      setPredictionContinuations([
        " ... beru na vědomí, ale trvám na svém původním stanovisku.",
        " ... v této záležitosti nehodlám dělat žádné kompromisy.",
        " ... očekávám, že moje osobní hranice budou plně respektovány."
      ]);
      setPredictionNextWords(offlineWords);
    } finally {
      setIsPredictingText(false);
    }
  };

  // 7. Secure Local Storage Operations (AES-GCM encryption)
  const handleLockHistory = () => {
    setIsHistoryLocked(true);
    setDecryptedHistory([]);
    setHistoryPassword("");
    setEncryptStatusMsg("Historie byla bezpečně uzamčena a smazána z operační paměti.");
  };

  const handleUnlockHistory = async () => {
    if (!historyPassword) {
      setEncryptStatusMsg("Zadejte šifrovací heslo.");
      return;
    }

    try {
      const decryptedList: DecryptedHistoryEntry[] = [];
      for (const item of encryptedHistory) {
        const decryptedText = await decryptText(item.ciphertext, item.salt, item.iv, historyPassword);
        decryptedList.push({
          id: item.id,
          timestamp: item.timestamp,
          title: item.title,
          text: decryptedText
        });
      }
      setDecryptedHistory(decryptedList);
      setIsHistoryLocked(false);
      setEncryptStatusMsg("Dešifrování úspěšné. Lokální data jsou odemčena.");
    } catch (e) {
      setEncryptStatusMsg("Chyba dešifrování! Nesprávné heslo nebo poškozená data.");
    }
  };

  const handleSaveToHistory = async () => {
    const textToSave = activeTab === "rephrase" 
      ? rephraseOutput 
      : activeTab === "reply" 
        ? replyOutput 
        : finalOptimizedPrompt;
    if (!textToSave) {
      setEncryptStatusMsg("Není k dispozici žádný výsledek pro uložení.");
      return;
    }

    if (!historyPassword) {
      setEncryptStatusMsg("Pro uložení s šifrováním musíte zadat heslo do zámku v levém panelu.");
      return;
    }

    try {
      const title = activeTab === "rephrase" 
        ? `Refráze (Úroveň ${selectedLevel}) - ${new Date().toLocaleTimeString()}`
        : activeTab === "reply"
          ? `Asertivní odpověď - ${new Date().toLocaleTimeString()}`
          : `Optimalizace promptu - ${new Date().toLocaleTimeString()}`;

      // Encrypt text using user's secure client-side password
      const encrypted = await encryptText(textToSave, historyPassword);

      const newEntry: EncryptedHistoryEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        timestamp: new Date().toLocaleString(),
        title,
        ciphertext: encrypted.ciphertext,
        salt: encrypted.salt,
        iv: encrypted.iv
      };

      const updatedHistory = [newEntry, ...encryptedHistory];
      saveEncryptedToLocalStorage(updatedHistory);

      // Also update currently decrypted view if not locked
      if (!isHistoryLocked) {
        setDecryptedHistory([
          {
            id: newEntry.id,
            timestamp: newEntry.timestamp,
            title: newEntry.title,
            text: textToSave
          },
          ...decryptedHistory
        ]);
      }

      setEncryptStatusMsg("Položka byla bezpečně zašifrována pomocí AES-GCM a uložena.");
    } catch (e) {
      setEncryptStatusMsg("Nepodařilo se zašifrovat data.");
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = encryptedHistory.filter(item => item.id !== id);
    saveEncryptedToLocalStorage(updated);
    setDecryptedHistory(decryptedHistory.filter(item => item.id !== id));
    setEncryptStatusMsg("Položka byla smazána ze zařízení.");
  };

  // 8. Share Link Generation
  const handleShareLink = () => {
    try {
      const stateToShare = {
        text: inputText,
        level: selectedLevel,
        tab: activeTab,
        prompt: inputPrompt,
        receivedMessage,
        toneStyle
      };
      
      const serialized = btoa(JSON.stringify(stateToShare));
      const shareUrl = `${window.location.origin}${window.location.pathname}#${serialized}`;
      
      navigator.clipboard.writeText(shareUrl);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (e) {
      console.error("Failed to generate share link", e);
    }
  };

  // 9. Export to PDF (Native high-contrast layout printing)
  const handleExportPDF = () => {
    window.print();
  };

  // Filter dictionary items for Dictionary Tab
  const filteredDict = OFFLINE_DICTIONARY.filter(entry => {
    const matchesSearch = 
      entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.level3.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.english.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedDictCategory === "Všechny" || 
      entry.category === selectedDictCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredLearned = learnedWords.filter(entry => {
    const matchesSearch = 
      entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.level3.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.english.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedDictCategory === "Všechny" || 
      entry.category === selectedDictCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div id="app-root" className="flex flex-col min-h-screen bg-slate-50 dark:bg-workspace-bg text-slate-950 dark:text-[#e5e7eb] font-sans print:bg-white print:text-black transition-colors duration-200">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <nav id="navbar" className="h-14 bg-white dark:bg-workspace-sidebar border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 shrink-0 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-600 dark:bg-purple-500 rounded-xs" />
          <span className="text-base font-bold tracking-tight text-slate-800 dark:text-white uppercase font-mono">
            Linguist.AI <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded ml-1 border border-slate-200 dark:border-white/10">V2.5</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* AI Sebeučení pulse badge */}
          {(isLearning || learningStatus) && (
            <div className="hidden lg:flex items-center gap-2 bg-purple-50 dark:bg-purple-950/20 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/40 animate-fade-in shrink-0">
              <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider truncate max-w-[240px]">
                {isLearning ? "AI Sebeučení běží..." : learningStatus}
              </span>
            </div>
          )}

          {/* Online / Offline badge */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-workspace-panel px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>Online (Gemini AI aktivní)</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                <span>Offline (Slovníkový balíček)</span>
              </>
            )}
          </div>

          {/* Theme Toggle Button (Sun/Moon switch) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 bg-slate-100 dark:bg-workspace-panel hover:bg-slate-200 dark:hover:bg-workspace-bg rounded text-slate-600 dark:text-zinc-400 transition-all border border-slate-200 dark:border-white/10 cursor-pointer flex items-center justify-center shrink-0"
            title={isDarkMode ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
          </button>

          <div className="flex items-center gap-2 border-l pl-4 border-slate-200 dark:border-white/10">
            <button 
              id="export-pdf-btn"
              onClick={handleExportPDF}
              className="px-3 py-1.5 text-[11px] font-mono font-medium bg-white dark:bg-workspace-panel border border-slate-300 dark:border-white/10 rounded hover:bg-slate-50 dark:hover:bg-workspace-bg transition-colors flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 cursor-pointer"
              title="Vytiskne nebo uloží aktuální zobrazení do PDF"
            >
              <FileDown className="w-3.5 h-3.5" /> Export_PDF
            </button>
            <button 
              id="share-link-btn"
              onClick={handleShareLink}
              className={`px-3 py-1.5 text-[11px] font-mono font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                isShared 
                  ? "bg-green-600 text-white border-none" 
                  : "bg-blue-600 dark:bg-purple-600 text-white hover:bg-blue-700 dark:hover:bg-purple-700 border-none"
              }`}
              title="Vytvoří unikátní odkaz s aktuálním textem a nastavením"
            >
              {isShared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {isShared ? "COPIED" : "SHARE_LINK"}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN SPLIT CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDEBAR (No-Print) */}
        <aside id="sidebar" className="w-full md:w-64 bg-slate-50 dark:bg-workspace-sidebar border-r border-slate-200 dark:border-white/10 flex flex-col p-4 shrink-0 no-print gap-4">
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab("rephrase")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                activeTab === "rephrase" 
                  ? "bg-blue-50 dark:bg-purple-950/20 text-blue-700 dark:text-purple-400 border-l-4 border-blue-600 dark:border-purple-500" 
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-600 dark:text-purple-400" />
                <span>Překlad & Analýza</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab("prompt")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                activeTab === "prompt" 
                  ? "bg-blue-50 dark:bg-purple-950/20 text-blue-700 dark:text-purple-400 border-l-4 border-blue-600 dark:border-purple-500" 
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-purple-400" />
                <span>Prompt Optimizer</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab("explain")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                activeTab === "explain" 
                  ? "bg-blue-50 dark:bg-purple-950/20 text-blue-700 dark:text-purple-400 border-l-4 border-blue-600 dark:border-purple-500" 
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-purple-400" />
                <span>Predikce textu</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab("reply")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                activeTab === "reply" 
                  ? "bg-blue-50 dark:bg-purple-950/20 text-blue-700 dark:text-purple-400 border-l-4 border-blue-600 dark:border-purple-500" 
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-purple-400" />
                <span>Asertivní odpovědi</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab("dictionary")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                activeTab === "dictionary" 
                  ? "bg-blue-50 dark:bg-purple-950/20 text-blue-700 dark:text-purple-400 border-l-4 border-blue-600 dark:border-purple-500" 
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-purple-400" />
                <span>Odborný slovník ({OFFLINE_DICTIONARY.length + learnedWords.length})</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* SECURE AES-GCM LOCAL STORAGE DRAWER */}
          <div className="mt-auto p-4 bg-white dark:bg-workspace-panel border border-slate-200 dark:border-white/10 rounded-lg shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 inline text-slate-500 dark:text-purple-500" /> AES-GCM SECURE_MODE
              </span>
              {isHistoryLocked ? (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded font-mono font-bold uppercase">Zamčeno</span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 rounded font-mono font-bold uppercase">Odemčeno</span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal font-sans">
              Vaše historie překladů a promptů je šifrována přímo v prohlížeči pomocí AES-GCM s PBKDF2 kódováním. Žádná nezašifrovaná data neopustí toto zařízení.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase block tracking-wider font-mono">Šifrovací heslo:</label>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="Zadejte silné heslo..."
                  value={historyPassword}
                  onChange={(e) => setHistoryPassword(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-purple-500 pr-7 text-slate-900 dark:text-white"
                />
                <Key className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400 dark:text-zinc-600" />
              </div>
            </div>

            <div className="flex gap-2 font-mono">
              {isHistoryLocked ? (
                <button 
                  onClick={handleUnlockHistory}
                  className="flex-1 py-1.5 px-2.5 bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
                >
                  <Unlock className="w-3 h-3" /> DEŠIFROVAT
                </button>
              ) : (
                <button 
                  onClick={handleLockHistory}
                  className="flex-1 py-1.5 px-2.5 bg-slate-600 dark:bg-zinc-800 hover:bg-slate-700 dark:hover:bg-zinc-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
                >
                  <Lock className="w-3 h-3" /> UZAMKNOUT
                </button>
              )}
            </div>

            {encryptStatusMsg && (
              <p className="text-[9px] font-mono text-blue-700 dark:text-purple-400 bg-blue-50 dark:bg-purple-950/20 p-1.5 rounded border border-blue-100 dark:border-purple-900/30">
                {encryptStatusMsg}
              </p>
            )}

            {/* Display list of history items only when unlocked */}
            {!isHistoryLocked && decryptedHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5 max-h-48 overflow-y-auto">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block font-mono uppercase tracking-wider">Dešifrovaná historie ({decryptedHistory.length}):</span>
                {decryptedHistory.map((item) => (
                  <div key={item.id} className="p-1.5 bg-slate-50 dark:bg-black/40 rounded border border-slate-100 dark:border-white/5 relative group text-[10px]">
                    <div className="font-bold text-slate-700 dark:text-zinc-300 truncate pr-5">{item.title}</div>
                    <div className="text-[9px] text-slate-400 dark:text-zinc-500 mb-1">{item.timestamp}</div>
                    <p className="text-slate-600 dark:text-zinc-400 line-clamp-2 bg-white dark:bg-black/60 p-1 rounded border border-slate-100 dark:border-white/5">{item.text}</p>
                    <div className="flex gap-1.5 mt-1 font-mono">
                      <button 
                        onClick={() => {
                          if (activeTab === "rephrase") {
                            setInputText(item.text);
                          } else {
                            setInputPrompt(item.text);
                          }
                          setEncryptStatusMsg("Historická položka načtena do editoru.");
                        }}
                        className="text-[9px] text-blue-600 dark:text-purple-400 hover:underline"
                      >
                        Načíst
                      </button>
                      <button 
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="text-[9px] text-rose-600 dark:text-rose-400 hover:underline ml-auto"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 3. CORE ACTIVE TAB CONTAINER */}
        <main id="main-content" className="flex-1 flex flex-col p-6 overflow-hidden">
          
          {/* TAB 1: TEXT REPHRASER */}
          {activeTab === "rephrase" && (
            <div className="flex-1 flex flex-col gap-6 min-h-0">
              
              {/* Header block with offline indication */}
              <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Linguistický Stylizátor & Analytik</h1>
                  <p className="text-sm text-slate-600">Přeformátujte text do 3 úrovní obtížnosti nebo proveďte zpětný překlad do srozumitelné lidské řeči.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Režim:</span>
                  <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                    <button 
                      onClick={() => setIsReverse(false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        !isReverse ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Přeformulovat
                    </button>
                    <button 
                      onClick={() => setIsReverse(true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        isReverse ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Zpětný překlad (Srozumitelnost)
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Split Columns for Input and Output */}
              <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                
                {/* Input Text Panel */}
                <div className="flex-1 flex flex-col gap-3 min-h-[250px]">
                  <div className="flex items-center justify-between shrink-0">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      Vstupní text v češtině 
                      <span className="text-xs text-slate-400 font-normal">
                        ({inputText.length} znaků, podporuje tabulátor pro automatické dokončení slova)
                      </span>
                    </label>
                    <button 
                      onClick={() => {
                        setInputText("");
                        setPrediction("");
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Vymazat vše
                    </button>
                  </div>

                  {/* Textarea Wrapper for Custom Ghost Autocomplete Suggestion overlay */}
                  <div className="flex-1 bg-white border border-slate-300 rounded-xl p-4 shadow-sm relative focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex flex-col min-h-0">
                    <div className="relative flex-1 overflow-auto">
                      {/* Textarea overlay */}
                      <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Napište nebo vložte text... Např. 'Umělá neuronová síť je klíčem k pokroku.' a stiskněte klávesu Tab pro dokončení výrazů."
                        className="w-full h-full min-h-[160px] resize-none border-0 p-0 focus:ring-0 focus:outline-none text-slate-800 leading-relaxed text-sm bg-transparent relative z-10"
                      />
                      
                      {/* Ghost Autocomplete Overlay */}
                      {prediction && (
                        <div className="absolute pointer-events-none text-sm leading-relaxed text-slate-300 top-0 left-0 z-0 pl-0 select-none">
                          <span className="opacity-0">{inputText}</span>
                          <span className="bg-blue-50 text-blue-500 border border-blue-200 px-1 py-0.5 rounded text-xs ml-1 animate-pulse select-none">
                            Stiskněte Tab pro: &quot;{prediction}&quot;
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Live Autocomplete / Prediction Helper (Aktivní a plně funkční pomocník) */}
                    {prediction && (
                      <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-fade-in shrink-0">
                        <span className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          Našeptávač: doplnit <strong className="font-bold underline">{prediction}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded shadow-xs text-[9px] text-slate-500 font-mono">Tab ⇥</kbd>
                          <button 
                            type="button"
                            onClick={() => {
                              setInputText(prev => prev + prediction + " ");
                              setPrediction("");
                              textareaRef.current?.focus();
                            }}
                            className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            Doplnit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Integrated Quick-Word triggers for autocomplete training */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Rychlá offline klíčová slova:</span>
                      {OFFLINE_DICTIONARY.slice(0, 5).map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => {
                            const separator = inputText.length > 0 && !inputText.endsWith(" ") ? " " : "";
                            setInputText(prev => prev + separator + entry.term);
                            textareaRef.current?.focus();
                          }}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md text-xs font-medium border border-slate-200 transition-colors"
                        >
                          +{entry.term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Level Controls & Rephrased Output Panel */}
                <div className="flex-1 flex flex-col gap-3 min-h-[250px]">
                  
                  {/* Selected Level Switcher */}
                  <div className="flex items-center justify-between shrink-0">
                    <label className="text-sm font-semibold text-slate-700">Cílová úroveň / Obtížnost</label>
                    <span className="text-xs text-slate-500">
                      {isReverse ? "Aktivní: Zjednodušení textu" : `Aktivní: Úroveň ${selectedLevel}`}
                    </span>
                  </div>

                  {!isReverse ? (
                    <div className="flex gap-1 bg-slate-200 p-1 rounded-lg shrink-0 border border-slate-300">
                      <button 
                        onClick={() => setSelectedLevel(1)}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                          selectedLevel === 1 
                            ? "bg-white shadow-sm text-blue-700 border border-slate-300" 
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <span className="block font-bold">Úroveň 1</span>
                        <span className="text-[10px] font-normal block opacity-80">Pár odborných slov, jasné</span>
                      </button>
                      <button 
                        onClick={() => setSelectedLevel(2)}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                          selectedLevel === 2 
                            ? "bg-white shadow-sm text-blue-700 border border-slate-300" 
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <span className="block font-bold">Úroveň 2</span>
                        <span className="text-[10px] font-normal block opacity-80">Vyšší abstrakce, vzdělání</span>
                      </button>
                      <button 
                        onClick={() => setSelectedLevel(3)}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                          selectedLevel === 3 
                            ? "bg-white shadow-sm text-blue-700 border border-slate-300" 
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <span className="block font-bold">Úroveň 3 (Expert)</span>
                        <span className="text-[10px] font-normal block opacity-80">Expertní a vědecká analýza</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200 leading-relaxed font-medium">
                      💡 <strong>Režim zjednodušení:</strong> Algoritmus zpětně přeloží složité vědecké výrazy, souvětí a latinské nebo technické výrazy do srozumitelné a přímočaré lidské řeči.
                    </div>
                  )}

                  {/* Output Display Card */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm min-h-0">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl shrink-0">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" /> 
                        Výsledek analýzy & transformace
                      </h3>
                      <div className="flex items-center gap-2">
                        {rephraseOutput && (
                          <>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(rephraseOutput);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                              }}
                              className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1"
                              title="Kopírovat výsledek"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? "Zkopírováno" : "Kopírovat"}</span>
                            </button>
                            <button 
                              onClick={handleSaveToHistory}
                              className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 ml-2"
                              title="Uložit zašifrovaně do lokální historie"
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Uložit šifrovaně</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto text-sm leading-relaxed text-slate-800 space-y-4 print:text-black">
                      {isRephrasing ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                          <p className="text-xs font-semibold uppercase tracking-wider animate-pulse">
                            {isOnline ? "Vzdálené zpracování modelem Gemini 3.5-Flash..." : "Zpracovávám lokálně pomocí offline slovníku..."}
                          </p>
                        </div>
                      ) : rephraseOutput ? (
                        <div className="whitespace-pre-wrap font-sans prose prose-slate max-w-none">
                          {rephraseOutput}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-center py-12 flex flex-col items-center justify-center gap-2">
                          <FileText className="w-10 h-10 text-slate-300" />
                          <p className="text-xs">Zatím nebyly vygenerovány žádné výsledky.</p>
                          <p className="text-[11px] text-slate-400">Zadejte text vlevo a klikněte na tlačítko &quot;Spustit analýzu&quot;.</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl shrink-0 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isOnline 
                          ? "Model: gemini-3.5-flash (Online)" 
                          : "Zdroj: [Offline-Expert-Vocabulary.bin] načten z lokálního úložiště"}
                      </span>
                      
                      <button
                        onClick={handleRephrase}
                        disabled={!inputText.trim() || isRephrasing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRephrasing ? "animate-spin" : ""}`} />
                        {isRephrasing ? "Zpracovávám..." : "Spustit analýzu & transformaci"}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PROMPT OPTIMIZER WITH AGENTIC LOOP */}
          {activeTab === "prompt" && (
            <div className="flex-1 flex flex-col gap-6 min-h-0 animate-fade-in">
              <div className="header-block">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Prompt Optimizer</h1>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  Technický engine pro strukturální analýzu a optimalizaci promptů prostřednictvím agentických cyklů: Návrh ➜ Kritika ➜ Sebe-korekce. Offline zpracování dat.
                </p>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Input prompt area */}
                <div className="flex-1 flex flex-col gap-3 min-h-[200px]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">Zadání jednoduchého nápadu nebo promptu:</span>
                  <div className="flex-grow flex flex-col min-h-0">
                    <div className="p-3 bg-slate-50 dark:bg-black/40 border-t border-r border-l border-slate-200 dark:border-white/10 flex items-center justify-between rounded-t-xl shrink-0">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-purple-500"></span>
                        INPUT_BUFFER
                      </span>
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        PLAIN_TEXT
                      </span>
                    </div>

                    <div className="flex-1 bg-white dark:bg-workspace-panel border border-slate-200 dark:border-white/10 rounded-b-xl flex flex-col min-h-0 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-purple-500 transition-all">
                      <textarea
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        placeholder="Napište jednoduchý nápad nebo prompt, např.: 'Napiš mi plán pro zdravý jídelníček' nebo 'Udělej analýzu prodeje aut v ČR'..."
                        className="w-full flex-1 resize-none border-0 p-4 focus:ring-0 focus:outline-none text-slate-800 dark:text-zinc-200 leading-relaxed text-sm bg-transparent font-mono"
                      />
                      
                      <div className="p-3 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 rounded-b-xl">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Automated agent logic enabled // [Offline-Ready]
                        </span>
                        <button
                          onClick={handleOptimizePrompt}
                          disabled={!inputPrompt.trim() || isOptimizing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white dark:disabled:text-zinc-500 rounded font-mono font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          {isOptimizing ? "RUNNING_LOOP..." : "EXECUTE_LOOP"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps and output progress */}
                <div className="flex-1 flex flex-col gap-3 min-h-[250px]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">Strukturální zpětná vazba & Výstupní proud:</span>
                  
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-3 bg-slate-50 dark:bg-black/40 border-t border-r border-l border-slate-200 dark:border-white/10 flex items-center justify-between rounded-t-xl shrink-0">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        OUTPUT_STREAM
                      </span>
                      {finalOptimizedPrompt ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(finalOptimizedPrompt);
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-purple-400 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? "COPIED" : "COPY_PROMPT"}</span>
                          </button>
                          <button 
                            onClick={handleSaveToHistory}
                            className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-purple-400 flex items-center gap-1 ml-2 bg-transparent border-none cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>VAULT_SAVE</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          OPTIMIZED
                        </span>
                      )}
                    </div>

                    <div className="flex-1 bg-white dark:bg-workspace-panel border border-slate-200 dark:border-white/10 rounded-b-xl flex flex-col shadow-xs min-h-0">
                      <div className="p-5 flex-1 overflow-y-auto space-y-4 min-h-0">
                        {isOptimizing ? (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-zinc-500 gap-4">
                            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-purple-500 animate-spin" />
                            <div className="text-center space-y-1">
                              <p className="text-xs font-mono font-bold uppercase tracking-wider animate-pulse text-blue-600 dark:text-purple-400">
                                AGENT_LOOP_ACTIVE
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs leading-relaxed mx-auto">
                                Generuji detailní návrh, spouštím kritický posudek a aplikuji korekční šablonu...
                              </p>
                            </div>
                          </div>
                        ) : optimizerSteps.length > 0 ? (
                          <div className="space-y-4">
                            {optimizerSteps.map((step, index) => (
                              <div key={index} className="border border-slate-200 dark:border-white/5 rounded-lg p-3 bg-slate-50 dark:bg-black/20">
                                <h4 className="text-xs font-mono font-bold text-blue-800 dark:text-purple-400 border-b border-blue-100 dark:border-purple-900/30 pb-1 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                  <ChevronRight className="w-3.5 h-3.5" /> {step.title}
                                </h4>
                                <pre className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed bg-white dark:bg-black p-2.5 rounded border border-slate-150 dark:border-white/5">
                                  {step.content}
                                </pre>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 dark:text-zinc-600 text-center py-24 flex flex-col items-center justify-center gap-4 flex-grow">
                            <svg className="w-8 h-8 text-slate-300 dark:text-zinc-700 stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            <div style={{ textAlign: 'center' }}>
                              <p className="font-mono text-xs text-slate-700 dark:text-zinc-400">Awaiting loop execution...</p>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Initialize input buffer to start.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFLINE DICTIONARY EXPLORER */}
          {activeTab === "dictionary" && (
            <div className="flex-1 flex flex-col gap-6 min-h-0">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">Balíček Výrazů (Odborný Slovník)</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Integrovaný offline slovník se zaměřením na zdravou komunikaci, asertivitu a odborné termíny. Funguje zcela offline a slouží k překladům i predikcím bez internetu.
                </p>
              </div>

              {/* Odkazy a zdroje odkud čerpáme */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 rounded-xl p-4 space-y-3 shrink-0">
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Kde tato slova hledat & odkud sami čerpáme (Informační zdroje):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <a 
                    href="https://www.psychologytoday.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <strong className="text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
                      Psychology Today
                      <span className="text-[10px] text-slate-400">↗</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Přední světový portál o mezilidských vztazích, emocích a asertivitě.</span>
                  </a>

                  <a 
                    href="https://slovnik-cizich-slov.abz.cz" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <strong className="text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
                      ABZ Slovník cizích slov
                      <span className="text-[10px] text-slate-400">↗</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Český etymologický a výkladový vyhledávač pro cizí odborné výrazy.</span>
                  </a>

                  <a 
                    href="https://cs.wikipedia.org/wiki/Asertivita" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <strong className="text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
                      Wikipedia: Asertivita
                      <span className="text-[10px] text-slate-400">↗</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Otevřená encyklopedie nabízející detailní akademické definice a techniky.</span>
                  </a>

                  <a 
                    href="https://nevypustdusi.cz" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <strong className="text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
                      Nevypusť duši
                      <span className="text-[10px] text-slate-400">↗</span>
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Česká iniciativa pro duševní zdraví a psychohygienu v mezilidských vztazích.</span>
                  </a>
                </div>
              </div>

              {/* Ruční Sebeučení (Formulář pro ruční přidání) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm shrink-0 space-y-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider cursor-pointer focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Učit aplikaci: Ručně přidat vlastní odborný výraz do paměti
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    {isFormOpen ? "Skrýt formulář ▲" : "Zobrazit formulář ▼"}
                  </span>
                </button>

                {isFormOpen && (
                  <form onSubmit={handleAddCustomTerm} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Název výrazu / Termín (česky):</label>
                      <input
                        type="text"
                        placeholder="Např. Kognitivní disonance"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Anglický ekvivalent:</label>
                      <input
                        type="text"
                        placeholder="Např. Cognitive dissonance"
                        value={newEnglish}
                        onChange={(e) => setNewEnglish(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Kategorie třídění:</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                      >
                        {["Mezilidské vztahy & Asertivita", "IT & AI", "Lékařství", "Právo", "Finance & Ekonomika", "Filozofie"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Srozumitelná lidská řeč (Úroveň 1 - jednoduchý význam):</label>
                      <input
                        type="text"
                        placeholder="Např. Pocit rozporu mezi vaším chováním a myšlením."
                        value={newSimple}
                        onChange={(e) => setNewSimple(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Expertní rozbor (Úroveň 3 - hluboká analýza):</label>
                      <textarea
                        placeholder="Zadejte vědeckou nebo hluboce psychologickou definici konceptu..."
                        value={newLevel3}
                        onChange={(e) => setNewLevel3(e.target.value)}
                        className="w-full h-16 text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Příklad použití v komunikaci:</label>
                      <input
                        type="text"
                        placeholder="Např. 'Při nátlaku šéfa jsem pociťoval silnou kognitivní disonanci, přesto jsem zůstal asertivní.'"
                        value={newContext}
                        onChange={(e) => setNewContext(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                      {addTermStatus && (
                        <p className={`text-xs font-semibold ${addTermStatus.startsWith("⚠️") ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                          {addTermStatus}
                        </p>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Uložit do paměti sebeučení
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Filtering and search row */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Vyhledávat ve výrazech, definicích, anglických ekvivalentech..."
                    className="w-full text-sm pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                <div className="flex gap-2 w-full md:w-auto shrink-0 overflow-x-auto">
                  {["Všechny", "Mezilidské vztahy & Asertivita", "IT & AI", "Lékařství", "Právo", "Finance & Ekonomika", "Filozofie"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedDictCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                        selectedDictCategory === cat 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dictionary items grid */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                
                {/* 1. SEBEUČENÍ SECTION */}
                {filteredLearned.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Slovník sebeučení: Naučené a vlastní výrazy ({filteredLearned.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredLearned.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 rounded-xl p-5 shadow-xs space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition-colors relative group">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded text-[10px] font-bold uppercase border border-purple-200 dark:border-purple-800/40">
                                {item.category}
                              </span>
                              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{item.term}</h3>
                              <p className="text-xs text-slate-400 italic">{item.english}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button 
                                onClick={() => {
                                  setInputText(item.term);
                                  setActiveTab("rephrase");
                                }}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-xs font-semibold cursor-pointer"
                              >
                                Vložit do editoru
                              </button>
                              <button 
                                onClick={() => handleDeleteLearnedWord(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                title="Smazat naučený výraz"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-150 dark:border-slate-800 pt-3">
                            <div>
                              <strong className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Srozumitelná lidská řeč (Úroveň 1):</strong>
                              <p className="bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded text-purple-950 dark:text-purple-300 font-medium">{item.simple}</p>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Expertní specifikace (Úroveň 3):</strong>
                              <p className="bg-slate-50 dark:bg-slate-950 p-2 rounded text-slate-800 dark:text-slate-200">{item.level3}</p>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-amber-50/30 dark:bg-amber-950/10 p-2 rounded border border-amber-100/50 dark:border-amber-900/40">
                              <strong>Příklad:</strong> &quot;{item.context}&quot;
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. STATICKÝ INTEGROVANÝ SLOVNÍK */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Integrovaná offline databáze ({filteredDict.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDict.length > 0 ? (
                      filteredDict.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                                {item.category}
                              </span>
                              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{item.term}</h3>
                              <p className="text-xs text-slate-400 italic">{item.english}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setInputText(item.term);
                                setActiveTab("rephrase");
                              }}
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-xs font-semibold cursor-pointer"
                            >
                              Vložit do editoru
                            </button>
                          </div>

                          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-150 dark:border-slate-800 pt-3">
                            <div>
                              <strong className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Srozumitelná lidská řeč (Úroveň 1):</strong>
                              <p className="bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded text-blue-950 dark:text-blue-300 font-medium">{item.simple}</p>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Expertní specifikace (Úroveň 3):</strong>
                              <p className="bg-slate-50 dark:bg-slate-950 p-2 rounded text-slate-800 dark:text-slate-200">{item.level3}</p>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-amber-50/30 dark:bg-amber-950/10 p-2 rounded border border-amber-100/50 dark:border-amber-900/40">
                              <strong>Příklad:</strong> &quot;{item.context}&quot;
                            </div>
                          </div>
                        </div>
                      ))
                    ) : filteredLearned.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-slate-400">
                        Nebyly nalezeny žádné odborné výrazy splňující kritéria.
                      </div>
                    ) : null}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: INTELLIGENT AI TEXT PREDICTION */}
          {activeTab === "explain" && (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                  Chytrá předpověď textu (AI Prediktor)
                </h1>
                <p className="text-sm text-slate-600">
                  Zadejte rozepsaný text nebo začátek věty. Náš inteligentní asistent (připojený na Gemini AI chat) v reálném čase předpoví další slova a navrhne nejvhodnější pokračování myšlenky s vysokým komunikačním statusem.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* INPUT AREA */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Váš rozepsaný text:
                      </label>
                      <textarea
                        value={predictionInputText}
                        onChange={(e) => {
                          setPredictionInputText(e.target.value);
                        }}
                        placeholder="Začněte psát, např.: 'Rád bych se vyjádřil k včerejšímu konfliktu, protože...' nebo 'Chci jasně stanovit, že...'"
                        className="w-full h-44 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                      />
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Znaků: {predictionInputText.length}</span>
                        <span>Komunikační status: Vysoký</span>
                      </div>
                    </div>

                    {/* STYLE SELECTION */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Cílový komunikační styl předpovědi:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "assertive", label: "Asertivní", color: "border-blue-500 bg-blue-50/50 text-blue-900" },
                          { id: "confident", label: "Sebevědomý", color: "border-emerald-500 bg-emerald-50/50 text-emerald-900" },
                          { id: "standard", label: "Fakta & Věcný", color: "border-slate-500 bg-slate-50 text-slate-900" }
                        ].map((styleOpt) => (
                          <button
                            key={styleOpt.id}
                            type="button"
                            onClick={() => setPredictionStyle(styleOpt.id as any)}
                            className={`py-2 px-3 border text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              predictionStyle === styleOpt.id
                                ? `${styleOpt.color} ring-1 ring-offset-1`
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {styleOpt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPredictingText}
                      onClick={() => handlePredictText(predictionInputText, predictionStyle)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isPredictingText ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI předvídá další myšlenky...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-4 h-4 animate-pulse" />
                          <span>Předpovědět pokračování (AI)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI PREDICTIONS OUTPUT */}
                <div className="lg:col-span-7 space-y-4">
                  {predictionError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{predictionError}</span>
                    </div>
                  )}

                  {!predictionContinuations.length && !isPredictingText ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400 space-y-3">
                      <Sparkles className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Můj chat je připraven předpovídat</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                          Napište kousek textu vlevo a klikněte na tlačítko. Gemini model se vcítí do vaší myšlenky a navrhne celá pokračování i jednotlivá slova. Jedním kliknutím je pak můžete připojit!
                        </p>
                      </div>
                    </div>
                  ) : isPredictingText ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-100 rounded-md w-1/3 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-10 bg-slate-100 rounded-md w-full animate-pulse"></div>
                          <div className="h-10 bg-slate-100 rounded-md w-full animate-pulse"></div>
                          <div className="h-10 bg-slate-100 rounded-md w-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="h-4 bg-slate-100 rounded-md w-1/4 animate-pulse"></div>
                        <div className="flex flex-wrap gap-2">
                          <div className="h-8 bg-slate-100 rounded-full w-16 animate-pulse"></div>
                          <div className="h-8 bg-slate-100 rounded-full w-20 animate-pulse"></div>
                          <div className="h-8 bg-slate-100 rounded-full w-14 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* 1. Sentence level continuations */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>💡</span> Navrhovaná pokračování (Klikněte pro vložení):
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5">
                          {predictionContinuations.map((cont, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const cleanCont = cont.replace(/^\s*\.\.\.\s*/, "").trim();
                                setPredictionInputText(prev => {
                                  const trimmed = prev.trimEnd();
                                  return trimmed + (trimmed ? " " : "") + cleanCont;
                                });
                              }}
                              className="text-left p-3.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 active:scale-[0.99] rounded-xl text-sm text-slate-800 leading-relaxed font-sans shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <span>{cont}</span>
                              <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">
                                + Připojit ↵
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Next single word suggestions */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>✨</span> Pravděpodobná další slova:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {predictionNextWords.map((word, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPredictionInputText(prev => {
                                  const trimmed = prev.trimEnd();
                                  return trimmed + (trimmed ? " " : "") + word;
                                });
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-900 active:scale-95 rounded-full text-xs font-medium text-slate-700 border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>{word}</span>
                              <span className="text-[9px] text-slate-400 font-mono">+</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Actions with the predicted text */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-slate-700">Co s hotovým textem?</h4>
                          <p className="text-[10px] text-slate-500 leading-normal">Můžete jej zkopírovat, nebo přenést do hlavního refrázovacího modulu.</p>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(predictionInputText);
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="flex-1 md:flex-none px-3.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Kopírovat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInputText(predictionInputText);
                              setActiveTab("rephrase");
                            }}
                            className="flex-1 md:flex-none px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Přenést do překladu</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASSERTIVE REPLY GENERATOR (Odpovědi na zprávy s pozitivním dopadem) */}
          {activeTab === "reply" && (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  Odpovědi na zprávy: Ochrana Hranic
                </h1>
                <p className="text-sm text-slate-600">
                  Zadejte manipulativní, pasivně-agresivní nebo nátlakovou zprávu. Asistent zanalyzuje skryté záměry pro posílení vašeho sebevědomí (pozitivní dopad) a vygeneruje nekompromisní asertivní odpověď.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* INPUT CONTROL PANEL */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Příchozí manipulativní zpráva:
                      </label>
                      <textarea
                        value={receivedMessage}
                        onChange={(e) => setReceivedMessage(e.target.value)}
                        placeholder="Sem vložte text zprávy (např.: 'Okamžitě to předělej, vůbec nechápu co ti trvá, hrozně jsi mě zklamal...')"
                        className="w-full h-44 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                      />
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Znaky: {receivedMessage.length}</span>
                        <span>Funguje 100% Offline i Online</span>
                      </div>
                    </div>

                    {/* TONE SELECTION */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Zvolit komunikační styl:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => setToneStyle("uncompromising")}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                            toneStyle === "uncompromising"
                              ? "bg-blue-50/50 border-blue-500 text-blue-900 ring-1 ring-blue-500"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            Ledově klidný a nekompromisní
                          </span>
                          <span className="text-[10px] text-slate-500 leading-normal pl-3">
                            Věcný, chladný tón, který dává najevo, že s vámi nelze manipulovat.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setToneStyle("confident")}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                            toneStyle === "confident"
                              ? "bg-blue-50/50 border-blue-500 text-blue-900 ring-1 ring-blue-500"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Sebevědomý a diplomatický
                          </span>
                          <span className="text-[10px] text-slate-500 leading-normal pl-3">
                            Vysoký status s nadhledem, zdvořilý ale s neprůstřelnými hranicemi.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setToneStyle("direct")}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                            toneStyle === "direct"
                              ? "bg-blue-50/50 border-blue-500 text-blue-900 ring-1 ring-blue-500"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Úderný a stručný
                          </span>
                          <span className="text-[10px] text-slate-500 leading-normal pl-3">
                            Maximálně zkrácený, žádné vysvětlování ani omluvy. Pouze fakta.
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isGeneratingReply || !receivedMessage.trim()}
                      onClick={handleGenerateReply}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                      {isGeneratingReply ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analyzuji zprávu a tvořím štít...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Vygenerovat asertivní odpověď</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* RESULTS PANEL */}
                <div className="lg:col-span-7 space-y-4">
                  {replyError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{replyError}</span>
                    </div>
                  )}

                  {!replyOutput && !isGeneratingReply ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400 space-y-3">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Čekám na zadání zprávy</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                          Vložte manipulativní text vlevo a klikněte na tlačítko. V reálném čase odhalíme toxické vzorce a navrhneme odpověď s vysokým statusem.
                        </p>
                      </div>
                    </div>
                  ) : isGeneratingReply ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-100 rounded-md w-1/3 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-100 rounded-md w-full animate-pulse"></div>
                          <div className="h-3 bg-slate-100 rounded-md w-5/6 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="h-4 bg-slate-100 rounded-md w-1/4 animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded-md w-3/4 animate-pulse"></div>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="h-4 bg-slate-100 rounded-md w-1/2 animate-pulse"></div>
                        <div className="h-16 bg-slate-100 rounded-md w-full animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Detailed Parsed Output Boxes */}
                      {(() => {
                        const parsed = (function(text: string) {
                          const sections = {
                            analysis: "",
                            strategy: "",
                            reply: ""
                          };

                          const analysisIndex = text.indexOf("### 🧠 PSYCHOLOGICKÝ ROZBOR");
                          const strategyIndex = text.indexOf("### 🛡️ DOPORUČENÁ STRATEGIE");
                          const replyIndex = text.indexOf("### 💬 NAVRŽENÁ ODPOVĚĎ");

                          const cleanAnalysisIdx = analysisIndex !== -1 ? analysisIndex : text.indexOf("PSYCHOLOGICKÝ ROZBOR");
                          const cleanStrategyIdx = strategyIndex !== -1 ? strategyIndex : text.indexOf("DOPORUČENÁ STRATEGIE");
                          const cleanReplyIdx = replyIndex !== -1 ? replyIndex : text.indexOf("NAVRŽENÁ ODPOVĚĎ");

                          if (cleanAnalysisIdx !== -1) {
                            const end = cleanStrategyIdx !== -1 ? cleanStrategyIdx : (cleanReplyIdx !== -1 ? cleanReplyIdx : text.length);
                            sections.analysis = text.substring(cleanAnalysisIdx, end).replace(/### 🧠 PSYCHOLOGICKÝ ROZBOR\s*\(Posílení pro Vás\)?(\s*\[Offline Režim\])?/gi, "").trim();
                          }

                          if (cleanStrategyIdx !== -1) {
                            const end = cleanReplyIdx !== -1 ? cleanReplyIdx : text.length;
                            sections.strategy = text.substring(cleanStrategyIdx, end).replace(/### 🛡️ DOPORUČENÁ STRATEGIE/gi, "").trim();
                          }

                          if (cleanReplyIdx !== -1) {
                            sections.reply = text.substring(cleanReplyIdx).replace(/### 💬 NAVRŽENÁ ODPOVĚĎ|### 💬 NAVRŽENÁ ODPOVĚD/gi, "").trim();
                          }

                          if (!sections.analysis && !sections.strategy && !sections.reply) {
                            sections.reply = text;
                          }

                          return sections;
                        })(replyOutput);

                        return (
                          <>
                            {parsed.analysis && (
                              <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-5 space-y-2.5">
                                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                                  <span className="p-1 bg-blue-100 text-blue-700 rounded-md">🧠</span>
                                  Psychologický rozbor (Pro Vaše sebevědomí)
                                </h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                                  {parsed.analysis}
                                </p>
                              </div>
                            )}

                            {parsed.strategy && (
                              <div className="bg-emerald-50/30 border border-emerald-200/50 rounded-xl p-5 space-y-2">
                                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                                  <span className="p-1 bg-emerald-100/80 text-emerald-700 rounded-md">🛡️</span>
                                  Doporučená komunikační strategie
                                </h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                                  {parsed.strategy}
                                </p>
                              </div>
                            )}

                            {parsed.reply && (
                              <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <span className="p-1 bg-slate-100 text-slate-700 rounded-md">💬</span>
                                    Navržená asertivní odpověď k odeslání
                                  </h3>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                                    Status: Vysoký status
                                  </span>
                                </div>

                                <div className="p-4 bg-slate-950 text-slate-100 font-sans text-sm md:text-base leading-relaxed rounded-lg border border-slate-800 shadow-inner select-all whitespace-pre-line">
                                  {parsed.reply}
                                </div>

                                <div className="flex flex-wrap gap-2.5 pt-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(parsed.reply);
                                      setIsCopied(true);
                                      setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                    className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-98 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span>Zkopírováno!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4" />
                                        <span>Zkopírovat odpověď</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleSaveToHistory}
                                    className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-98 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                                  >
                                    <Lock className="w-4 h-4 text-white/90" />
                                    <span>Uložit šifrovaně do paměti</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 4. FOOTER STATUS BAR */}
      <footer id="footer" className="h-8 bg-slate-800 text-[10px] text-slate-400 flex items-center px-6 justify-between shrink-0 no-print">
        <div>Lokální offline slovník: <span className="text-green-400 font-semibold">Synchronizován ({OFFLINE_DICTIONARY.length} výrazů)</span></div>
        <div className="flex gap-4">
          <span>Šifrovací standard: <strong className="text-slate-300">AES-GCM (PBKDF2 100k iterací)</strong></span>
          <span>Stav zabezpečení: <strong className="text-green-400">Aktivní lokal-only</strong></span>
        </div>
      </footer>
      
    </div>
  );
}
