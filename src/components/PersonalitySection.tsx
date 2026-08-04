import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Copy, 
  RefreshCw, 
  UserPlus, 
  Brain,
  HelpCircle,
  X
} from "lucide-react";
import { 
  PersonalityCategory, 
  PatientStatement, 
  INITIAL_PERSONALITY_CATEGORIES 
} from "../personalityData";
import { PersonalityCommunicationSimulator } from "./PersonalityCommunicationSimulator";

interface PersonalitySectionProps {
  isOnline: boolean;
  importedResultFromInterrogation?: any | null;
}

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({
  isOnline,
  importedResultFromInterrogation
}) => {
  // Load categories from localStorage or fallback to initial
  const [categories, setCategories] = useState<PersonalityCategory[]>(() => {
    if (typeof window === "undefined") return INITIAL_PERSONALITY_CATEGORIES;
    const stored = localStorage.getItem("lexiflow_personality_categories");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored personality categories", e);
      }
    }
    return INITIAL_PERSONALITY_CATEGORIES;
  });

  const [selectedCatId, setSelectedCatId] = useState<string>(() => {
    return categories[0]?.id || "narcissistic";
  });

  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Edit mode for notes
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [editedNotes, setEditedNotes] = useState<string>("");

  // Statement & Calm Response Generator state
  const [inputStatement, setInputStatement] = useState<string>("");
  const [inputUnconscious, setInputUnconscious] = useState<string>("");
  const [isGeneratingCalm, setIsGeneratingCalm] = useState<boolean>(false);
  const [calmError, setCalmError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state for adding new custom personality category
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDsmCode, setNewDsmCode] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [newDos, setNewDos] = useState<string>("");
  const [newDonts, setNewDonts] = useState<string>("");
  const [newCalmStrategy, setNewCalmStrategy] = useState<string>("");

  // Save categories to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lexiflow_personality_categories", JSON.stringify(categories));
    }
  }, [categories]);

  // Handle imported result from Interrogation
  useEffect(() => {
    if (importedResultFromInterrogation) {
      const primaryTitle = importedResultFromInterrogation.primaryCategory || "Nová kategorie z výslechu";
      
      // Check if category already exists
      const existing = categories.find(c => c.title.toLowerCase().includes(primaryTitle.toLowerCase()) || primaryTitle.toLowerCase().includes(c.title.toLowerCase()));

      if (existing) {
        // Update existing category with new notes
        setCategories(prev => prev.map(c => {
          if (c.id === existing.id) {
            return {
              ...c,
              psychiatristNotes: `${c.psychiatristNotes}\n\n--- AKTUALIZACE Z VÝSLECHU (${new Date().toLocaleDateString()}) ---\n${importedResultFromInterrogation.psychiatricDiagnosis || ""}`,
              calmHelpStrategy: importedResultFromInterrogation.calmStrategy || c.calmHelpStrategy
            };
          }
          return c;
        }));
        setSelectedCatId(existing.id);
      } else {
        // Create new category from interrogation result
        const newCat: PersonalityCategory = {
          id: `interrogated-${Date.now()}`,
          title: primaryTitle,
          dsmCode: "Profil z Výslechu",
          badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
          shortDescription: importedResultFromInterrogation.summary || "Kategorie vygenerovaná na základě 20 otázek a hádanek.",
          psychiatristNotes: importedResultFromInterrogation.psychiatricDiagnosis || "Klinická analýza nebyla poskytnuta.",
          communicationDos: importedResultFromInterrogation.communicationDos || ["Mluvte věcně a s klidem."],
          communicationDonts: importedResultFromInterrogation.communicationDonts || ["Nenapadat ego."],
          calmHelpStrategy: importedResultFromInterrogation.calmStrategy || "Udržovat klidný, respektující tón.",
          patientStatements: []
        };

        setCategories(prev => [newCat, ...prev]);
        setSelectedCatId(newCat.id);
      }
    }
  }, [importedResultFromInterrogation]);

  const activeCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  useEffect(() => {
    if (activeCategory) {
      setEditedNotes(activeCategory.psychiatristNotes);
      setIsEditingNotes(false);
      setGeneratedResult(null);
    }
  }, [selectedCatId]);

  const handleSaveNotes = () => {
    setCategories(prev => prev.map(c => {
      if (c.id === activeCategory.id) {
        return {
          ...c,
          psychiatristNotes: editedNotes
        };
      }
      return c;
    }));
    setIsEditingNotes(false);
  };

  const handleGenerateCalmResponse = async () => {
    if (!inputStatement.trim()) {
      setCalmError("⚠️ Zadejte prosím co dotyčný člověk řekl nebo napsal.");
      return;
    }

    setIsGeneratingCalm(true);
    setCalmError(null);

    try {
      if (isOnline) {
        const res = await fetch("/api/generate-calm-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statement: inputStatement,
            personalityType: activeCategory.title,
            psychiatristNotes: activeCategory.psychiatristNotes,
            userQueryContext: inputUnconscious
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Při generování klidné odpovědi došlo k chybě.");
        }

        const data = await res.json();
        if (data.result) {
          setGeneratedResult(data.result);
        } else {
          throw new Error("Neplatný výstup z AI serveru.");
        }
      } else {
        // Offline heuristic calm generator
        const offlineResult = {
          calmResponse: `Rozumím tomu, jak to vnímáš, a záleží mi na tom, abychom to vyřešili v klidu. Pojďme se podívat na fakta: ${inputStatement ? "můžeme postupovat krok za krokem." : "společně najdeme dohodu."}`,
          explanationOfStrategy: "Offline deeskalační vzorec: Validace emoce + zaměření na věcné řešení bez defenzivy.",
          psychologicalTriggersToAvoid: [
            "Zákaz útoků na inteligenci nebo kompetenci dotyčného.",
            "Nepoužívat sarkasmus ani pasivní chlad."
          ],
          underlyingUnconsciousNeed: "Dotyčný potřebuje cítit respekt, bezpečí a jistotu, že jeho názor má váhu."
        };
        setGeneratedResult(offlineResult);
      }
    } catch (err: any) {
      console.warn("AI Generation failed, using offline fallback:", err);
      const offlineResult = {
        calmResponse: `Vnímám, že tě tato situace trápí. Záleží mi na našem vzájemném respektu. Pojďme si v klidu ujasnit jednotlivé kroky, abychom předešli jakémukoliv nedorozumění.`,
        explanationOfStrategy: "Základní deeskalační rámec pro udržení klidu a zabránění konfliktu.",
        psychologicalTriggersToAvoid: ["Zvýšený hlas", "Odveta výčitkou"],
        underlyingUnconsciousNeed: "Potřeba uznání a kontroly nad situací."
      };
      setGeneratedResult(offlineResult);
      setCalmError("Klidná odpověď vygenerována pomocí lokálního deeskalačního algoritmu.");
    } finally {
      setIsGeneratingCalm(false);
    }
  };

  const handleSaveStatementToProfile = () => {
    if (!generatedResult || !activeCategory) return;

    const newStmt: PatientStatement = {
      id: `stmt-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      statement: inputStatement,
      unconsciousBehavior: inputUnconscious || generatedResult.underlyingUnconsciousNeed || "Dotyčný si plně neuvědomuje své obranné mechanizmy.",
      calmResponse: generatedResult.calmResponse,
      strategyNotes: generatedResult.explanationOfStrategy
    };

    setCategories(prev => prev.map(c => {
      if (c.id === activeCategory.id) {
        return {
          ...c,
          patientStatements: [newStmt, ...(c.patientStatements || [])]
        };
      }
      return c;
    }));

    // Reset inputs
    setInputStatement("");
    setInputUnconscious("");
    setGeneratedResult(null);
  };

  const handleDeleteStatement = (stmtId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === activeCategory.id) {
        return {
          ...c,
          patientStatements: c.patientStatements.filter(s => s.id !== stmtId)
        };
      }
      return c;
    }));
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: PersonalityCategory = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      dsmCode: newDsmCode || "Vlastní Profil",
      badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      shortDescription: newDescription || "Vlastní zadaná kategorie osobnosti.",
      psychiatristNotes: newNotes || "Zatím žádné psychiatrické poznámky.",
      communicationDos: newDos ? newDos.split("\n").filter(Boolean) : ["Mluvit věcně."],
      communicationDonts: newDonts ? newDonts.split("\n").filter(Boolean) : ["Nezvýšit hlas."],
      calmHelpStrategy: newCalmStrategy || "Zachovat klid a trpělivost.",
      patientStatements: []
    };

    setCategories([created, ...categories]);
    setSelectedCatId(created.id);
    setIsAddModalOpen(false);

    // Reset form
    setNewTitle("");
    setNewDsmCode("");
    setNewDescription("");
    setNewNotes("");
    setNewDos("");
    setNewDonts("");
    setNewCalmStrategy("");
  };

  const filteredCategories = categories.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.psychiatristNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.dsmCode && c.dsmCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-purple-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Brain className="w-64 h-64 text-purple-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border border-purple-500/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Psychiatrická Kartotéka & Asistent Klidné Komunikace
            </span>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Přidat novou kategorii osobnosti</span>
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Osobnosti, Psychiatrické Profily & Generátor Odpovědí
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Spravujte psychologické a psychiatrické profily jednotlivých typů osobností. Vkládejte konkrétní výpovědi lidí ("co řekli"), analyzujte co si v duchu neuvědomují, a nechte AI vygenerovat dokonalou deeskalační odpověď tak, aby byli vždy zcela v klidu.
          </p>
        </div>
      </div>

      {/* CATEGORY SELECTOR & SEARCH BAR */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat v kategoriích a poznámkách..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-workspace-panel text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
            />
          </div>

          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold">
            Celkem kategorií: {categories.length}
          </span>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredCategories.map((cat) => {
            const isSelected = cat.id === activeCategory.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-500 shadow-md scale-[1.02]"
                    : "bg-white dark:bg-workspace-panel text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-800"
                }`}
              >
                <span>{cat.title}</span>
                {cat.patientStatements?.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                  }`}>
                    {cat.patientStatements.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE PERSONALITY PROFILE DETAIL */}
      {activeCategory && (
        <div className="space-y-6">
          {/* MAIN PROFILE CARD */}
          <div className="bg-white dark:bg-workspace-panel p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
            {/* Title & DSM Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${activeCategory.badgeColor}`}>
                    {activeCategory.dsmCode || "Psychiatrický Profil"}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                  {activeCategory.title}
                </h2>
              </div>

              <span className="text-xs text-slate-500 dark:text-zinc-400 max-w-md font-sans">
                {activeCategory.shortDescription}
              </span>
            </div>

            {/* PSYCHIATRIST NOTES (EDITABLE) */}
            <div className="space-y-2 bg-slate-50 dark:bg-workspace-bg p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Klinické Poznámky Psychologa & Psychiatra
                </h3>

                {isEditingNotes ? (
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Uložit poznámky
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="px-2.5 py-1 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-bold rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Upravit poznámky
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  rows={6}
                  className="w-full text-xs p-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-workspace-panel text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeCategory.psychiatristNotes}
                </p>
              )}
            </div>

            {/* COMMUNICATION TIPS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DOS */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Jak s tímto člověkem komunikovat (Tipy):
                </h4>
                <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200 font-sans">
                  {activeCategory.communicationDos?.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* DONTS */}
              <div className="p-4 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Jaké chyby NIKDY nedělat (Komunikační faily):
                </h4>
                <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200 font-sans">
                  {activeCategory.communicationDonts?.map((dont, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                      <span>{dont}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CALM HELP STRATEGY BANNER */}
            <div className="p-4 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Jak jim být k pomoci & odpovídat tak, aby byli v klidu:
              </h4>
              <p className="text-xs text-purple-950 dark:text-purple-200 leading-relaxed font-sans">
                {activeCategory.calmHelpStrategy}
              </p>
            </div>
          </div>

          {/* COMMUNICATION TRAINING SIMULATOR WITH VOICE & MODEL SITUATIONS */}
          <PersonalityCommunicationSimulator 
            category={activeCategory} 
            isOnline={isOnline} 
          />

          {/* AI GENERATOR FOR CALM RESPONSES TO PATIENT STATEMENTS */}
          <div className="bg-white dark:bg-workspace-panel p-6 rounded-2xl border-2 border-purple-500/30 shadow-lg space-y-5">
            <div className="space-y-1 border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold uppercase rounded">
                  AI DEESKALAČNÍ GENERÁTOR
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Generátor Klidných Odpovědí ("Co řekli & Jak jim nejlépe odpovídat")
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Zadejte větu nebo dotaz dotyčného člověka (i když si sám neuvědomuje, jak se chová). AI vygeneruje odpověď šitou na míru profilu <strong>{activeCategory.title}</strong> tak, aby zůstal úplně v klidu.
              </p>
            </div>

            {/* INPUT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Co tento člověk řekl / napsal / jak odpovídá:
                </label>
                <textarea
                  value={inputStatement}
                  onChange={(e) => setInputStatement(e.target.value)}
                  placeholder="Např. 'Všechno zkazíte! Nemá smysl s vámi mluvit, stejně mě nikdo neposlouchá...'"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Co si v duchu neuvědomuje / Kontext:
                </label>
                <textarea
                  value={inputUnconscious}
                  onChange={(e) => setInputUnconscious(e.target.value)}
                  placeholder="Např. 'Má panický strach ze selhání a vlastní nespokojenosti, zakrývá úzkost agresivním tónem...'"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* GENERATE ACTION BUTTON */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerateCalmResponse}
                disabled={isGeneratingCalm}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingCalm ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Psychiatr sestavuje klidnou odpověď...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Vygenerovat klidnou deeskalační odpověď</span>
                  </>
                )}
              </button>
            </div>

            {calmError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                {calmError}
              </div>
            )}

            {/* GENERATED RESULT DISPLAY */}
            {generatedResult && (
              <div className="p-5 bg-gradient-to-br from-purple-50 via-slate-50 to-emerald-50 dark:from-purple-950/40 dark:via-workspace-bg dark:to-emerald-950/20 rounded-xl border-2 border-purple-400 dark:border-purple-800 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/40 pb-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Doporučená klidná odpověď (Přesné znění k odeslání)
                  </span>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedResult.calmResponse);
                      setCopiedId("generated");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-workspace-panel border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === "generated" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "generated" ? "Zkopírováno!" : "Zkopírovat odpověď"}</span>
                  </button>
                </div>

                <div className="p-4 bg-white dark:bg-workspace-panel rounded-xl border border-purple-200 dark:border-purple-900/50 text-slate-900 dark:text-white font-sans text-sm font-medium leading-relaxed shadow-xs">
                  "{generatedResult.calmResponse}"
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white/80 dark:bg-workspace-panel/80 rounded-lg border border-purple-100 dark:border-white/5 space-y-1">
                    <span className="font-bold text-purple-900 dark:text-purple-300 uppercase text-[10px] font-mono block">
                      Psychologická strategie:
                    </span>
                    <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {generatedResult.explanationOfStrategy}
                    </p>
                  </div>

                  {generatedResult.underlyingUnconsciousNeed && (
                    <div className="p-3 bg-white/80 dark:bg-workspace-panel/80 rounded-lg border border-purple-100 dark:border-white/5 space-y-1">
                      <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase text-[10px] font-mono block">
                        Podvědomá vnitřní potřeba:
                      </span>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {generatedResult.underlyingUnconsciousNeed}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveStatementToProfile}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Uložit výpověď & odpověď do karty {activeCategory.title}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SAVED PATIENT STATEMENTS HISTORY LIST */}
          <div className="bg-white dark:bg-workspace-panel p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase font-mono">
                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Uložené Výpovědi & Vygenerované Odpovědi ({activeCategory.patientStatements?.length || 0})
              </h3>
            </div>

            {!activeCategory.patientStatements || activeCategory.patientStatements.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs font-sans space-y-1">
                <p className="font-bold">Zatím žádné uložené výpovědi u této osobnosti.</p>
                <p>Použijte generátor výše pro vytvoření a uložení první klidné odpovědi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCategory.patientStatements.map((stmt) => (
                  <div 
                    key={stmt.id}
                    className="p-4 bg-slate-50 dark:bg-workspace-bg rounded-xl border border-slate-200 dark:border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Záznam ze dne: {stmt.date}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(stmt.calmResponse);
                            setCopiedId(stmt.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="px-2 py-0.5 bg-white dark:bg-workspace-panel text-slate-700 dark:text-zinc-300 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === stmt.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === stmt.id ? "Zkopírováno" : "Kopírovat odpověď"}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteStatement(stmt.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Smazat záznam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-workspace-panel rounded-lg border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="font-bold text-rose-700 dark:text-rose-400 uppercase text-[10px] font-mono block">
                          🗣️ Co řekl / Jak odpovídá:
                        </span>
                        <p className="text-slate-800 dark:text-zinc-200 italic font-sans leading-relaxed">
                          "{stmt.statement}"
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-workspace-panel rounded-lg border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="font-bold text-amber-700 dark:text-amber-400 uppercase text-[10px] font-mono block">
                          🧠 Co si neuvědomuje:
                        </span>
                        <p className="text-slate-700 dark:text-zinc-300 font-sans leading-relaxed">
                          {stmt.unconsciousBehavior}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase text-[10px] font-mono block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Doporučená klidná odpověď:
                      </span>
                      <p className="text-emerald-950 dark:text-emerald-100 font-medium leading-relaxed">
                        "{stmt.calmResponse}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FOR ADDING NEW CUSTOM PERSONALITY CATEGORY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-workspace-panel rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Přidat Novou Kategorii Osobnosti
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                    Název Kategorie / Typu osobnosti *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Např. Histrionsko-Dramatický typ"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                    DSM / ICD Kód nebo Zkratka
                  </label>
                  <input
                    type="text"
                    value={newDsmCode}
                    onChange={(e) => setNewDsmCode(e.target.value)}
                    placeholder="Např. DSM-5 301.50"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Stručný popis
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Stručný popis chování a rysů..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Klinické poznámky psychologa/psychiatra
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={4}
                  placeholder="Detailní rozbor, obranné mechanizmy, doporučený terapeutický přístup..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-800 dark:text-emerald-400 block">
                    Jak komunikovat (1 bod na řádek)
                  </label>
                  <textarea
                    value={newDos}
                    onChange={(e) => setNewDos(e.target.value)}
                    rows={3}
                    placeholder="Oceňovat emoce&#10;Mluvit tichým tónem..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-rose-800 dark:text-rose-400 block">
                    Co NIKDY nedělat (1 bod na řádek)
                  </label>
                  <textarea
                    value={newDonts}
                    onChange={(e) => setNewDonts(e.target.value)}
                    rows={3}
                    placeholder="Nekritizovat veřejně&#10;Nereagovat hněvem..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-purple-800 dark:text-purple-400 block">
                  Strategie pro udržení v klidu
                </label>
                <input
                  type="text"
                  value={newCalmStrategy}
                  onChange={(e) => setNewCalmStrategy(e.target.value)}
                  placeholder="Jak jim být k pomoci a odpovídat v klidu..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-workspace-bg text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-workspace-bg text-slate-700 dark:text-zinc-300 font-bold rounded-xl cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Vytvořit kategorii
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
