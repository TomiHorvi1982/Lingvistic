import React, { useState } from "react";
import { 
  ShieldAlert, 
  Brain, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  Award, 
  Zap, 
  FileText, 
  AlertTriangle,
  RotateCcw,
  UserCheck
} from "lucide-react";
import { 
  INTERROGATION_QUESTIONS, 
  InterrogationQuestion, 
  evaluateInterrogationOffline 
} from "../personalityData";

interface InterrogationSectionProps {
  isOnline: boolean;
  onTransferToPersonality: (result: any) => void;
}

export const InterrogationSection: React.FC<InterrogationSectionProps> = ({
  isOnline,
  onTransferToPersonality
}) => {
  // Answers map questionId -> text
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("Všechny");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  // Filter questions
  const categories = ["Všechny", "Reakce na Stres", "Logické Hádanky", "Scénář", "Ego & Morálka"];

  const filteredQuestions = INTERROGATION_QUESTIONS.filter(q => {
    if (selectedCategory === "Všechny") return true;
    if (selectedCategory === "Ego & Morálka") return q.category === "Ego & Morálka";
    return q.category === selectedCategory;
  });

  const filledCount = Object.keys(answers).filter(k => answers[Number(k)]?.trim().length > 0).length;

  const handleOptionSelect = (qId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: text
    }));
  };

  const handleFillDemoAnswers = () => {
    const demo: Record<number, string> = {
      1: "A) Okamžitě přeruším dotyčného a rázně očistím své jméno, protože nedovolím, aby někdo zpochybňoval mou autoritu.",
      2: "A) Zapnu spínač 1 na 10 minut (žárovka se zahřeje), pak ho vypnu, zapnu spínač 2 a vstoupím. Svítící = 2, teplá = 1, studená = 3.",
      3: "A) Chyba byla v neschopnosti týmu a špatně nastavených podmínkách, já jsem svou část udělal perfektně.",
      4: "B) Téměř nikdy se nemýlím, málokdy má někdo lepší argumenty než já.",
      5: "A) Přehodím výhybku na 1 člověka, protože zachránit 5 životů má absolutní prioritu před jakýmkoliv příkazem autority.",
      6: "A) Cítím vnitřní hněv, že okolí obdivuje průměrnost, a jemně poukážu na nedostatky jeho práce.",
      7: "A) Zeptám se: 'Kterou bránu by mi k pravdě doporučil ten druhý strážce?' A zvolím tu druhou.",
      8: "A) Propadnu velké frustraci a hrubě dotyčnému vytknu jeho nekompetenci a nedochvilnost.",
      9: "A) Nenechám se citově vydírat. Vlídně ale nekompromisně odmítnu.",
      10: "A) Má absolutní neústupnost v logice, detailech a nekompromisní pravdě.",
      11: "A) Odpovím ironickou poznámkou a nechám ho v tiché domácnosti.",
      12: "A) Otočím kartu [A] a kartu [7] pro ověření pravidla.",
      13: "A) Pravidla jsou jen doporučením, pokud mě zbytečně brzdí v dosahování výjimečných výsledků.",
      14: "A) Nikdy nedávám najevo slabost ani zranitelnost, lidé by to hned zneužili.",
      15: "A) Když někdo veřejně zpochybňuje mé schopnosti, inteligenci nebo autoritu.",
      16: "A) Změním dveře! Pravděpodobnost výhry se tím zvýší z 1/3 na 2/3.",
      17: "B) Nikdy neustoupím. Pravda a má správnost musí zvítězit za každou cenu.",
      18: "A) Určitě se smějí mně a řeší mé chování.",
      19: "A) Nemohu to vystát. Okamžitě to předělám do perfektního stavu sám.",
      20: "A) Chtěl bych mít více trpělivosti a projevovat více vřelosti ke svým blízkým."
    };
    setAnswers(demo);
    setEvalError(null);
  };

  const handleResetAnswers = () => {
    setAnswers({});
    setEvaluationResult(null);
    setEvalError(null);
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setEvalError(null);

    const formattedPayload = INTERROGATION_QUESTIONS.map(q => ({
      id: q.id,
      question: q.question,
      answer: answers[q.id] || "Bez odpovědi"
    }));

    try {
      if (isOnline) {
        const res = await fetch("/api/evaluate-interrogation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: formattedPayload })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Serverové vyhodnocení selhalo.");
        }

        const data = await res.json();
        if (data.result) {
          setEvaluationResult(data.result);
        } else {
          throw new Error("Neplatný formát odpovedi z AI serveru.");
        }
      } else {
        // Offline evaluate
        const offlineResult = evaluateInterrogationOffline(formattedPayload);
        setEvaluationResult(offlineResult);
      }
    } catch (err: any) {
      console.warn("AI Evaluation failed, switching to offline evaluation engine:", err);
      // Graceful offline fallback
      const offlineResult = evaluateInterrogationOffline(formattedPayload);
      setEvaluationResult(offlineResult);
      setEvalError("AI výsledek vygenerován pomocí lokálního diagnostického algoritmu.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Brain className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              Psychologický Výslech & Profilování
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
              20 Sofistikovaných Otázek & Hádanek
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Výslech & Diagnostický Test Osobnosti
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Odpovězte na 20 otázek kombinujících krizové scénáře, logické hádanky (Wason, Monty Hall, 3 spínače) a reakce na autoritu. 
            AI klinický psycholog vyhodnotí přesnou kategorii osobnosti a stanoví doporučený styl komunikace.
          </p>
        </div>
      </div>

      {/* TOP CONTROLS & PROGRESS */}
      <div className="bg-white dark:bg-workspace-panel p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-workspace-bg text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-workspace-bg px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10">
            {filledCount} / 20 Vyplněno
          </span>
          
          <button
            onClick={handleFillDemoAnswers}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Předvyplní vzorové odpovědi pro okamžité otestování AI profilování"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
            <span>Rychlý test (20 vzorových odpovědí)</span>
          </button>

          {filledCount > 0 && (
            <button
              onClick={handleResetAnswers}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
              title="Vymazat všechny odpovědi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QUESTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.map((q) => {
          const currentAns = answers[q.id] || "";
          const isFilled = currentAns.trim().length > 0;

          return (
            <div 
              key={q.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isFilled 
                  ? "bg-white dark:bg-workspace-panel border-indigo-300 dark:border-indigo-700/50 shadow-xs" 
                  : "bg-white dark:bg-workspace-panel border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    q.category === "Logická Hádanka" 
                      ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                      : q.category === "Reakce na Stres"
                      ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                      : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                  }`}>
                    {q.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {q.title}
                  </h3>
                </div>
                {isFilled && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans bg-slate-50 dark:bg-workspace-bg p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                {q.question}
              </p>

              {/* Preset Radio Options if provided */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    Předdefinované reakce:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {q.options.map((opt) => {
                      const fullOptionText = `${opt.label}) ${opt.text}`;
                      const isSelected = currentAns === fullOptionText;

                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleOptionSelect(q.id, fullOptionText)}
                          className={`text-left p-2 rounded-lg text-xs transition-all border cursor-pointer flex items-start gap-2 ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-100 font-medium"
                              : "bg-white dark:bg-workspace-bg border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-800"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                          }`}>
                            {opt.label}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text Area for Custom Details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  Slovní odpověď / Vlastní poznámka:
                </span>
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder={q.placeholder}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* EVALUATE ACTION BAR */}
      <div className="bg-white dark:bg-workspace-panel p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Vyhodnocení Výslechu AI Psychiatrem
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Zpracuje všech 20 odpovědí a sestaví kompletní profil včetně přenesení do sekce Osobnosti.
          </p>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isEvaluating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>AI Analýza & Diagnostika probíhá...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              <span>Vyhodnotit Výslech (AI Profilátor)</span>
            </>
          )}
        </button>
      </div>

      {evalError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{evalError}</span>
        </div>
      )}

      {/* EVALUATION RESULTS DASHBOARD */}
      {evaluationResult && (
        <div className="space-y-6 animate-fade-in bg-white dark:bg-workspace-panel p-6 rounded-2xl border-2 border-indigo-500/30 shadow-2xl">
          {/* RESULTS HEADER */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md uppercase tracking-wider">
                VYHODNOCENÍ VÝSLECHU ZOKOMPLETED
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Diagnostický Profil Osobnosti
              </h2>
            </div>

            <button
              onClick={() => onTransferToPersonality(evaluationResult)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>Přidat / Aktualizovat v sekci Osobnosti</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* BADGES & SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-workspace-bg rounded-xl border border-indigo-200 dark:border-indigo-800/40 space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-mono">
                Hlavní Kategorie Osobnosti:
              </span>
              <div className="text-lg font-black text-indigo-950 dark:text-indigo-200">
                {evaluationResult.primaryCategory}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pt-1">
                {evaluationResult.summary}
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-purple-950/40 dark:to-workspace-bg rounded-xl border border-purple-200 dark:border-purple-800/40 space-y-2">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block font-mono">
                Sekundární Kategorie / Doprovodný Typ:
              </span>
              <div className="text-lg font-black text-purple-950 dark:text-purple-200">
                {evaluationResult.secondaryCategory || "Nespecifikováno"}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pt-1">
                Kombinace těchto dvou kategorií vytváří specifickou reakci na stres a autoritu.
              </p>
            </div>
          </div>

          {/* TRAIT SCORES PROGRESS BARS */}
          {evaluationResult.traitScores && evaluationResult.traitScores.length > 0 && (
            <div className="p-5 bg-slate-50 dark:bg-workspace-bg rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Kvantitativní Analýza Traitů & Obranných Mechanizmů
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluationResult.traitScores.map((t: any, idx: number) => (
                  <div key={idx} className="space-y-1.5 bg-white dark:bg-workspace-panel p-3 rounded-lg border border-slate-150 dark:border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{t.trait}</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.score} %</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, t.score))}%` }}
                      />
                    </div>
                    {t.description && (
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PSYCHIATRIC DIAGNOSIS NOTES */}
          <div className="p-5 bg-slate-900 text-slate-100 rounded-xl space-y-2 border border-slate-800 font-sans">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Klinický Rozbor Psychiatra (Psychiatric Record)
            </h3>
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-300 font-sans">
              {evaluationResult.psychiatricDiagnosis}
            </p>
          </div>

          {/* DOS AND DONTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DOS */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Jak s tímto člověkem komunikovat (Doporučení):
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                {evaluationResult.communicationDos?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DONTS */}
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Jaké chyby NIKDY nedělat (Triggery):
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
                {evaluationResult.communicationDonts?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DE-ESCALATION CALM STRATEGY */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Strategie udržení člověka v klidu (De-escalation Strategy):
            </h4>
            <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed font-sans">
              {evaluationResult.calmStrategy}
            </p>
          </div>

          {/* ACTION TRANSFER TO PERSONALITY SECTION */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onTransferToPersonality(evaluationResult)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Uložit a otevřít v sekci Osobnosti</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
