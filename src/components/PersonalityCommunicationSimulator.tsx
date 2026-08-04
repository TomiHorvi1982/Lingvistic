import React, { useState, useEffect, useRef } from "react";
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Award, 
  BookOpen, 
  HelpCircle, 
  ArrowRight,
  Zap,
  Shield,
  MessageSquare,
  BarChart2
} from "lucide-react";
import { PersonalityCategory } from "../personalityData";
import { 
  ModelSituation, 
  SimulationTurnRecord, 
  getModelSituationsForCategory 
} from "../simulationData";

interface Props {
  category: PersonalityCategory;
  isOnline: boolean;
}

export const PersonalityCommunicationSimulator: React.FC<Props> = ({ category, isOnline }) => {
  // Scenarios for active category
  const scenarios = getModelSituationsForCategory(category.title, category.id);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || "");
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Simulation State
  const [currentTension, setCurrentTension] = useState<number>(activeScenario.initialTension);
  const [currentPersonaStatement, setCurrentPersonaStatement] = useState<string>(activeScenario.initialStatement);
  const [historyTurns, setHistoryTurns] = useState<SimulationTurnRecord[]>([]);
  const [userResponseInput, setUserResponseInput] = useState<string>("");
  
  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [lastStepOutcome, setLastStepOutcome] = useState<"calmed" | "neutral" | "infuriated" | null>(null);

  // End of simulation summary state
  const [isSimulationFinished, setIsSimulationFinished] = useState<boolean>(false);

  // Speech Synthesis (TTS - Hlasový simulátor)
  const [isAutoPlayVoice, setIsAutoPlayVoice] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [voiceRate, setVoiceRate] = useState<number>(activeScenario.speechTone.rate);
  const [voicePitch, setVoicePitch] = useState<number>(activeScenario.speechTone.pitch);

  // Speech Recognition (STT - Hlasový vstup)
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Reset simulation when scenario changes
  useEffect(() => {
    if (activeScenario) {
      setCurrentTension(activeScenario.initialTension);
      setCurrentPersonaStatement(activeScenario.initialStatement);
      setHistoryTurns([]);
      setUserResponseInput("");
      setLastStepOutcome(null);
      setIsSimulationFinished(false);
      setVoiceRate(activeScenario.speechTone.rate);
      setVoicePitch(activeScenario.speechTone.pitch);

      if (isAutoPlayVoice) {
        speakText(activeScenario.initialStatement, activeScenario.speechTone.pitch, activeScenario.speechTone.rate);
      }
    }
  }, [selectedScenarioId]);

  // Handle Speech Synthesis
  const speakText = (text: string, pitchVal = voicePitch, rateVal = voiceRate) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // stop previous

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "cs-CZ";
    utterance.pitch = pitchVal;
    utterance.rate = rateVal;

    // Try to find a Czech voice
    const voices = window.speechSynthesis.getVoices();
    const czVoice = voices.find(v => v.lang.includes("cs") || v.lang.includes("CZ"));
    if (czVoice) {
      utterance.voice = czVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Toggle Speech Recognition
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Hlasový vstup (Speech Recognition) není ve vašem prohlížeči podporován. Použijte prosím textové pole.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = "cs-CZ";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setUserResponseInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Offline step evaluator heuristic
  const evaluateOfflineStep = (userText: string, statement: string, tension: number) => {
    const textLower = userText.toLowerCase();

    // Positive calm triggers
    const calmKeywords = [
      "rozumím", "vnímám", "chápu", "máš pravdu", "respektuji", "pojďme", "v klidu", 
      "společně", "záleží mi", "děkuji", "omlouvám se", "bezpečí", "podporuji"
    ];

    // Aggressive / escalation triggers
    const angryKeywords = [
      "ty jsi", "vždycky", "nikdy", "nesmysl", "blbost", "lžeš", "uklidni se", 
      "přestaň", "přeháníš", "neříkej", "tvoje chyba", "za to můžeš", "hlupák", "debil"
    ];

    let calmScore = 0;
    calmKeywords.forEach(k => { if (textLower.includes(k)) calmScore += 1; });
    
    let angryScore = 0;
    angryKeywords.forEach(k => { if (textLower.includes(k)) angryScore += 2; });

    let outcome: "calmed" | "neutral" | "infuriated" = "neutral";
    let delta = 0;

    if (angryScore > calmScore || textLower.includes("uklidni se")) {
      outcome = "infuriated";
      delta = 25 + Math.floor(Math.random() * 20);
    } else if (calmScore > 0) {
      outcome = "calmed";
      delta = -(25 + Math.floor(Math.random() * 15));
    } else {
      outcome = "neutral";
      delta = 5;
    }

    const newTension = Math.max(0, Math.min(100, tension + delta));

    // Generate persona counter response
    let counterResp = "";
    if (outcome === "calmed") {
      counterResp = `Hm... Vnímám, že to myslíš vážně. Dobře, aspoň že si dokážeme promluvit normálně.`;
    } else if (outcome === "infuriated") {
      counterResp = `To si děláš srandu?! Ty mi tady ještě budeš něco diktovat?! Nic jsi nepochopil!`;
    } else {
      counterResp = `Pořád mi připadá, že se vyhýbáš tomu hlavnímu. Co s tím tedy hodláš udělat?`;
    }

    const evaluationText = outcome === "calmed" 
      ? "Použil jste validující výraz a nepotvrdil jste konfrontační vnadidlo."
      : outcome === "infuriated"
      ? "Použil jste útočné zájmeno nebo zakázanou frázi ('uklidni se'), což narcistní/emocionální ego dešifrovalo jako útok!"
      : "Odpověď byla vlažná. Osobnost zůstává v nejistotě.";

    const idealResponse = category.patientStatements[0]?.calmResponse || activeScenario.sampleIdealResponse;
    const explanationWhy = activeScenario.sampleIdealWhy;

    return {
      outcome,
      newTensionLevel: newTension,
      personaCounterResponse: counterResp,
      evaluationText,
      idealResponse,
      explanationWhy
    };
  };

  // Submit User Response
  const handleSubmitResponse = async () => {
    if (!userResponseInput.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setEvalError(null);

    const promptStatement = currentPersonaStatement;
    const currentTensionVal = currentTension;
    const responseText = userResponseInput.trim();

    try {
      let evalResult: any = null;

      if (isOnline) {
        const res = await fetch("/api/evaluate-simulation-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalityType: category.title,
            psychiatristNotes: category.psychiatristNotes,
            scenarioTitle: activeScenario.title,
            scenarioDescription: activeScenario.contextDescription,
            currentTensionLevel: currentTensionVal,
            personaStatement: promptStatement,
            userResponse: responseText
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.result) evalResult = data.result;
        }
      }

      if (!evalResult) {
        evalResult = evaluateOfflineStep(responseText, promptStatement, currentTensionVal);
      }

      const outcome = evalResult.outcome || "neutral";
      const newTension = typeof evalResult.newTensionLevel === "number" ? Math.max(0, Math.min(100, evalResult.newTensionLevel)) : currentTensionVal;
      const counterResp = evalResult.personaCounterResponse || "Pokračujme v rozhovoru...";

      // Record Turn
      const newTurnRecord: SimulationTurnRecord = {
        stepIndex: historyTurns.length + 1,
        personaStatement: promptStatement,
        userResponse: responseText,
        outcome,
        tensionBefore: currentTensionVal,
        tensionAfter: newTension,
        evaluationText: evalResult.evaluationText || "Vyhodnoceno.",
        idealResponse: evalResult.idealResponse || activeScenario.sampleIdealResponse,
        explanationWhy: evalResult.explanationWhy || activeScenario.sampleIdealWhy
      };

      setHistoryTurns(prev => [...prev, newTurnRecord]);
      setLastStepOutcome(outcome);
      setCurrentTension(newTension);
      setCurrentPersonaStatement(counterResp);
      setUserResponseInput("");

      // Voice TTS of new counter response
      if (isAutoPlayVoice) {
        const pitchAdjust = outcome === "infuriated" ? 1.3 : outcome === "calmed" ? 0.9 : 1.0;
        const rateAdjust = outcome === "infuriated" ? 1.2 : outcome === "calmed" ? 0.85 : 1.0;
        speakText(counterResp, pitchAdjust, rateAdjust);
      }

      // Check if finished (if tension reached 0 or 100 or completed 4 turns)
      if (newTension <= 10 || newTension >= 98 || historyTurns.length >= 3) {
        // Automatically suggest ending or show finish option
      }
    } catch (err: any) {
      console.error("Simulation step failed:", err);
      const fallback = evaluateOfflineStep(responseText, promptStatement, currentTensionVal);
      const newTurnRecord: SimulationTurnRecord = {
        stepIndex: historyTurns.length + 1,
        personaStatement: promptStatement,
        userResponse: responseText,
        outcome: fallback.outcome,
        tensionBefore: currentTensionVal,
        tensionAfter: fallback.newTensionLevel,
        evaluationText: fallback.evaluationText,
        idealResponse: fallback.idealResponse,
        explanationWhy: fallback.explanationWhy
      };
      setHistoryTurns(prev => [...prev, newTurnRecord]);
      setLastStepOutcome(fallback.outcome);
      setCurrentTension(fallback.newTensionLevel);
      setCurrentPersonaStatement(fallback.personaCounterResponse);
      setUserResponseInput("");

      if (isAutoPlayVoice) {
        speakText(fallback.personaCounterResponse);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Restart Simulation
  const handleRestartSimulation = () => {
    if (!activeScenario) return;
    setCurrentTension(activeScenario.initialTension);
    setCurrentPersonaStatement(activeScenario.initialStatement);
    setHistoryTurns([]);
    setUserResponseInput("");
    setLastStepOutcome(null);
    setIsSimulationFinished(false);

    if (isAutoPlayVoice) {
      speakText(activeScenario.initialStatement, activeScenario.speechTone.pitch, activeScenario.speechTone.rate);
    }
  };

  // Calculate Overall Score
  const calculateFinalGrade = () => {
    if (historyTurns.length === 0) return { grade: "N/A", color: "text-slate-400", title: "Bez dat" };
    
    const calmedCount = historyTurns.filter(t => t.outcome === "calmed").length;
    const infuriatedCount = historyTurns.filter(t => t.outcome === "infuriated").length;

    if (currentTension <= 25 || calmedCount > infuriatedCount + 1) {
      return { 
        grade: "A+", 
        color: "text-emerald-500", 
        title: "Mistr Deeskalace a Terapeutické Komunikace",
        desc: "Dokázal jste udržet pevné hranice, nezreagoval jste na provokace a osobnost úspěšně zklidnil."
      };
    } else if (currentTension <= 55) {
      return { 
        grade: "B", 
        color: "text-blue-500", 
        title: "Konstruktivní Komunikátor",
        desc: "Situace byla zvládnutelná. Některé věty sice vyvolaly drobný odpor, ale vyhnal jste konflikt z krizové zóny."
      };
    } else if (currentTension <= 80) {
      return { 
        grade: "C", 
        color: "text-amber-500", 
        title: "Rizikový Reaktivní Přístup",
        desc: "Osobnost zůstává v napětí. Použil jste formulace, které defenzivní ego dešifruje jako útok."
      };
    } else {
      return { 
        grade: "F", 
        color: "text-rose-500", 
        title: "Masivní Eskalace a Afektivní Výbuch!",
        desc: "Osobnost byla těžce rozzuřena. Zmáčkl jste citlivé psychiatrické triggery a vyvolal obranou agresi."
      };
    }
  };

  const finalGrade = calculateFinalGrade();

  // Gauge color based on tension
  const getGaugeColor = (t: number) => {
    if (t <= 35) return "from-emerald-500 to-teal-400";
    if (t <= 65) return "from-amber-500 to-yellow-400";
    return "from-rose-600 to-red-500 animate-pulse";
  };

  return (
    <div className="bg-white dark:bg-workspace-panel rounded-2xl border-2 border-purple-500/30 p-6 shadow-xl space-y-6">
      {/* SECTION HEADER & MODEL SITUATION SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-600 text-white font-mono text-[10px] font-extrabold uppercase rounded shadow-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              INTERAKTIVNÍ HLASOVÝ SIMULÁTOR
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              Profil: <strong>{category.title}</strong>
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Trenažér Komunikace & Modelové Situace
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Vyberte si modelovou situaci od klidné až po extrémně vyostřenou. Hlasový simulátor bude mluvit přímo v češtině a po vaší odpovědi ihned vyhodnotí, zda jste člověka uklidnil nebo ještě víc rozzuřil!
          </p>
        </div>

        {/* SCENARIO SELECTOR BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((sc) => {
            const isSelected = sc.id === activeScenario.id;
            let badgeBg = "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300";
            if (sc.level === "calm") badgeBg = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300";
            if (sc.level === "medium") badgeBg = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300";
            if (sc.level === "escalated" || sc.level === "extreme") badgeBg = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300";

            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-500 shadow-md"
                    : "bg-white dark:bg-workspace-panel border-slate-200 dark:border-white/10 hover:border-purple-300"
                }`}
              >
                <span>{sc.levelLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SCENARIO CONTEXT CARD */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 dark:from-purple-950/30 dark:via-workspace-bg dark:to-indigo-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-extrabold text-purple-950 dark:text-purple-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            {activeScenario.title}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-workspace-panel text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/10 font-bold">
            POČÁTEČNÍ TENZE: {activeScenario.initialTension}%
          </span>
        </div>
        <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
          <strong>Kontext prostředí:</strong> {activeScenario.contextDescription}
        </p>
      </div>

      {!isSimulationFinished ? (
        <div className="space-y-6">
          {/* TENSION / ANGER GAUGE & TTS CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-workspace-bg p-4 rounded-xl border border-slate-200 dark:border-white/10">
            {/* ANGER METER GAUGE */}
            <div className="md:col-span-7 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${currentTension > 60 ? "text-rose-500 animate-bounce" : "text-amber-500"}`} />
                  MÍRA NAPĚTÍ & VZTEKU OSOBNOSTI:
                </span>
                <span className={`text-sm font-black ${currentTension > 70 ? "text-rose-600 dark:text-rose-400" : currentTension > 40 ? "text-amber-600" : "text-emerald-600"}`}>
                  {currentTension}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getGaugeColor(currentTension)}`}
                  style={{ width: `${currentTension}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% Klid</span>
                <span>50% Podráždění</span>
                <span>100% Afektivní Výbuch</span>
              </div>
            </div>

            {/* TTS SPEECH SIMULATOR CONTROLS */}
            <div className="md:col-span-5 flex flex-col items-end gap-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakText(currentPersonaStatement)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-xs ${
                    isPlayingAudio
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? "Zastavit hlas" : "🔊 Přehrát hlas osobnosti"}</span>
                </button>

                <button
                  onClick={() => setIsAutoPlayVoice(!isAutoPlayVoice)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                    isAutoPlayVoice
                      ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-white/10"
                  }`}
                  title="Automaticky přehrávat hlas po každém kroku"
                >
                  Auto-hlas: {isAutoPlayVoice ? "ZAP" : "VYP"}
                </button>
              </div>

              {/* Pitch / Speed Voice Fine-Tuning */}
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                <label className="flex items-center gap-1">
                  Rychlost:
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="w-14 accent-purple-600 cursor-pointer"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Výška:
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-14 accent-purple-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* SIMULATED PERSONA DIALOGUE BUBBLE */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl space-y-3 relative overflow-hidden border border-purple-900/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                SIMULOVANÁ OSOBNOST ({category.title}):
              </span>

              {isPlayingAudio && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  HLASOVÝ SIMULÁTOR HLÁSÍ...
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-white/10 font-sans text-base md:text-lg font-medium leading-relaxed tracking-wide text-slate-100 italic">
              "{currentPersonaStatement}"
            </div>

            {/* LAST STEP OUTCOME BADGE */}
            {lastStepOutcome && (
              <div className="pt-1 flex items-center gap-2 animate-fade-in">
                {lastStepOutcome === "calmed" && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    UKLIDNIL SE! (Odpověděl jste správně)
                  </span>
                )}
                {lastStepOutcome === "neutral" && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    NEUTRÁLNÍ (Napětí stagnuje)
                  </span>
                )}
                {lastStepOutcome === "infuriated" && (
                  <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    JEŠTĚ VÍC SE ROZZUŘIL! (Zmáčkl jste triggery)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* USER RESPONSE INPUT FORM */}
          <div className="space-y-3 bg-slate-50 dark:bg-workspace-bg p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Vaše odpověď (Zadejte text nebo použijte hlasový diktát):
              </label>

              <button
                type="button"
                onClick={toggleListening}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isListening
                    ? "bg-rose-600 text-white animate-bounce border-rose-700"
                    : "bg-white dark:bg-workspace-panel text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-purple-400"
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-purple-600" />}
                <span>{isListening ? "Poslouchám... (Mluvte)" : "Hlasový vstup"}</span>
              </button>
            </div>

            <textarea
              value={userResponseInput}
              onChange={(e) => setUserResponseInput(e.target.value)}
              placeholder="Napište nebo nadiktujte vaši deeskalační odpověď..."
              rows={3}
              className="w-full text-xs md:text-sm p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-workspace-panel text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestartSimulation}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restartovat situaci</span>
                </button>

                {historyTurns.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSimulationFinished(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Ukončit & Zobrazit Vyhodnocení ({historyTurns.length} reakcí)</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmitResponse}
                disabled={!userResponseInput.trim() || isEvaluating}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                {isEvaluating ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>AI Vyhodnocuje vaši odpověď...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Odeslat odpověď & Vyhodnotit reakci</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* END OF SIMULATION COMPLETE RECAP DASHBOARD */
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl space-y-4 border border-purple-800/50 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/40 pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-500/30 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  ZÁVĚREČNÉ EVALUAČNÍ VYSVĚTČENÍ
                </span>
                <h3 className="text-2xl font-black">
                  Vyhodnocení Komunikační Simulace
                </h3>
                <p className="text-xs text-slate-300">
                  Detailní rozbor vašich odpovedí, správné deeskalační vzorce a psychologické vysvětlení "PROČ".
                </p>
              </div>

              {/* GRADE BADGE */}
              <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-white/10">
                <div className={`text-4xl font-black ${finalGrade.color}`}>
                  {finalGrade.grade}
                </div>
                <div className="text-left space-y-0.5">
                  <span className="text-xs font-bold block">{finalGrade.title}</span>
                  <span className="text-[10px] text-slate-400 leading-tight block max-w-xs">{finalGrade.desc}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleRestartSimulation}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Spustit simulaci znovu</span>
              </button>
            </div>
          </div>

          {/* TURN BY TURN RECAP TABLE & DETAILED ANALYSIS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Detailní rozpis vašich odpovědí a doporučených replik:
            </h4>

            <div className="space-y-4">
              {historyTurns.map((turn, i) => (
                <div
                  key={i}
                  className="p-5 bg-slate-50 dark:bg-workspace-bg rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold border-b border-slate-200 dark:border-white/10 pb-2">
                    <span className="text-purple-700 dark:text-purple-400">
                      KROK #{turn.stepIndex} - PROBĚHLÁ REAKCE
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                      turn.outcome === "calmed" 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : turn.outcome === "infuriated"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      Napětí: {turn.tensionBefore}% ➔ {turn.tensionAfter}% ({turn.outcome === "calmed" ? "Uklidnil se" : turn.outcome === "infuriated" ? "Rozzuřil se" : "Stagnace"})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* PERSONA STATEMENT */}
                    <div className="p-3 bg-white dark:bg-workspace-panel rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px] font-mono block">
                        🗣️ Co řekla osobnost ({category.title}):
                      </span>
                      <p className="text-slate-900 dark:text-white italic font-sans font-medium">
                        "{turn.personaStatement}"
                      </p>
                    </div>

                    {/* USER ACTUAL RESPONSE */}
                    <div className="p-3 bg-white dark:bg-workspace-panel rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                      <span className="font-bold text-blue-600 dark:text-purple-400 uppercase text-[10px] font-mono block">
                        ✍️ Vaše odpověď:
                      </span>
                      <p className="text-slate-800 dark:text-zinc-200 font-sans">
                        "{turn.userResponse}"
                      </p>
                    </div>
                  </div>

                  {/* EVALUATION & IDEAL RESPONSE & WHY */}
                  <div className="space-y-3 pt-2">
                    {/* IDEAL RESPONSE */}
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-1 text-xs">
                      <span className="font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Co jste MĚL/A odpovedět (Ideální deeskalační replika):
                      </span>
                      <p className="text-emerald-950 dark:text-emerald-100 font-bold text-sm leading-relaxed">
                        "{turn.idealResponse}"
                      </p>
                    </div>

                    {/* PSYCHOLOGICAL WHY */}
                    <div className="p-4 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-xl space-y-1.5 text-xs">
                      <span className="font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        PROČ Tato Odpověď Funguje & Rozbor Psychologie:
                      </span>
                      <p className="text-purple-950 dark:text-purple-200 leading-relaxed font-sans">
                        {turn.explanationWhy}
                      </p>

                      <div className="pt-1 text-[11px] text-purple-800 dark:text-purple-300 italic border-t border-purple-200 dark:border-purple-800/30 mt-2">
                        <strong>Hodnocení vašeho pokusu:</strong> {turn.evaluationText}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
