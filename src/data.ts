export interface TermEntry {
  id: string;
  term: string;       // Complex term
  simple: string;     // Simple explanation / translation
  english: string;    // English professional term
  category: string;   // Category: IT, Medicine, Law, Finance, Philosophy, Interpersonal
  context: string;    // Context example sentence
  level3: string;     // Level 3 (expert scientific) analysis explanation
}

export const OFFLINE_DICTIONARY: TermEntry[] = [
  {
    id: "rel-1",
    term: "Asertivita",
    simple: "schopnost vyjádřit své pocity, názory a potřeby přímo, upřímně a jasně bez narušování práv ostatních",
    english: "Assertiveness",
    category: "Mezilidské vztahy & Asertivita",
    context: "Díky asertivitě dokážu odmítnout nátlak šéfa klidným, věcným a sebevědomým hlasem.",
    level3: "Komunikační dovednost stojící na pomezí pasivity a agrese, založená na vědomém sebeprosazení, vnitřní integritě a respektu k lidským právům všech zúčastněných stran."
  },
  {
    id: "rel-2",
    term: "Gaslighting",
    simple: "psychologický nátlak, kdy se vám někdo snaží namluvit, že vaše vnímání reality, paměť nebo pocity jsou chybné",
    english: "Gaslighting",
    category: "Mezilidské vztahy & Asertivita",
    context: "Když mi partner tvrdil, že jsem si tu urážku vymyslel, uvědomil jsem si, že jde o gaslighting.",
    level3: "Forma chronické sociálně-psychologické manipulace, při níž agresor systematicky deformuje objektivní fakta s cílem narušit kognitivní validitu a psychickou stabilitu oběti."
  },
  {
    id: "rel-3",
    term: "Osobní hranice",
    simple: "pomyslná čára, která definuje, co je pro nás ve vztazích s druhými přijatelné a bezpečné, a co už ne",
    english: "Personal Boundaries",
    category: "Mezilidské vztahy & Asertivita",
    context: "Nastavit si pevné osobní hranice v rodině mi zachránilo duševní klid.",
    level3: "Dynamické psychologické bariéry regulující interpersonalní distanc, intruzi a emocionální kontaminaci ze strany vnějších subjektů."
  },
  {
    id: "rel-4",
    term: "Pasivní agrese",
    simple: "skryté vyjadřování hněvu nebo odporu namísto otevřené diskuse (např. ironické narážky nebo uražené mlčení)",
    english: "Passive Aggression",
    category: "Mezilidské vztahy & Asertivita",
    context: "Jeho ironická poznámka byla jasným příkladem pasivní agrese v práci.",
    level3: "Maladaptivní vzorec chování projevující se nepřímým vyjadřováním latentního hněvu, obstrukcionismem, hostilním mlčením a skrytým odporem vůči požadavkům autorit či okolí."
  },
  {
    id: "rel-5",
    term: "Emoční vydírání",
    simple: "nátlak, kdy se ve vás druhá strana snaží vyvolat pocit viny, strachu nebo povinnosti, abyste udělali, co chce",
    english: "Emotional Blackmail",
    category: "Mezilidské vztahy & Asertivita",
    context: "Věta 'jestli mě máš rád, tak tam nepůjdeš' je klasické emoční vydírání.",
    level3: "Interpersonalní manipulativní transakce (FOG: Fear, Obligation, Guilt), při níž jedna strana zneužívá zranitelnosti a emočního pouta k vynucení konformního chování."
  },
  {
    id: "rel-6",
    term: "Empatie",
    simple: "schopnost vcítit se do situace a emocí druhého člověka a podívat se na svět jeho očima",
    english: "Empathy",
    category: "Mezilidské vztahy & Asertivita",
    context: "Bez empatie nelze vybudovat upřímný vztah ani úspěšně vyřešit konflikt.",
    level3: "Komplexní kognitivní a afektivní proces umožňující vnitřní simulaci emočního stavu a perspektivy alter ega bez ztráty vlastní identity (self-other distinction)."
  },
  {
    id: "rel-7",
    term: "Manipulace",
    simple: "skrytá snaha ovlivnit vaše myšlení, pocity nebo činy ve prospěch někoho jiného, často s využitím polopravd a emocí",
    english: "Manipulation",
    category: "Mezilidské vztahy & Asertivita",
    context: "Sladká slova plná pochval měla jen odvrátit pozornost, šlo o čistou manipulaci.",
    level3: "Strategické komunikační chování zaměřené na asymetrické ovlivňování rozhodovacích procesů cílového subjektu prostřednictvím klamu, polopravd a emocionálního nátlaku."
  },
  {
    id: "rel-8",
    term: "Projekce",
    simple: "když své vlastní potlačované vady, pocity nebo špatné vlastnosti podvědomě připisujete někomu jinému",
    english: "Psychological Projection",
    category: "Mezilidské vztahy & Asertivita",
    context: "Sám mě obviňuje ze lhaní, i když je to projekce jeho vlastního nečestného chování.",
    level3: "Podvědomý intrapsychický obranný mechanismus, při němž jsou vlastní nepřijatelné impulsy, sklony či afekty externalizovány a atribuovány jiným osobám."
  },
  {
    id: "rel-9",
    term: "Aktivní naslouchání",
    simple: "vědomé a plné soustředění se na to, co nám partner říká, s cílem mu doopravdy porozumět, nikoli jen vymyslet svou odpověď",
    english: "Active Listening",
    category: "Mezilidské vztahy & Asertivita",
    context: "Aktivní naslouchání mi pomohlo pochopit, co moji kolegyni skutečně trápí.",
    level3: "Systematická komunikační technika zahrnující verbální i neverbální potvrzení (verbální zrcadlení, parafrázování, validace emocí) pro optimalizaci přenosu informace a snížení komunikačního šumu."
  },
  {
    id: "rel-10",
    term: "Kompromis",
    simple: "dohoda, při níž obě strany ustoupí ze svých nároků, aby nalezly společné řešení přijatelné pro oba",
    english: "Compromise",
    category: "Mezilidské vztahy & Asertivita",
    context: "Nechtěli jsme jet na hory ani k moři, tak jsme jako kompromis zvolili české lázně.",
    level3: "Interaktivní vyjednávací strategie (Win-Win / Lose-Lose hybrid), kde dochází k recipročnímu snížení původních utilitárních požadavků zúčastněných aktérů za účelem dosažení ekvilibria."
  },
  {
    id: "it-1",
    term: "Umělá neuronová síť",
    simple: "počítačový systém napodobující lidský mozek",
    english: "Artificial Neural Network",
    category: "IT & AI",
    context: "Umělá neuronová síť zpracovává data podobně jako lidské neurony.",
    level3: "Matematicko-výpočetní model složený z vrstev umělých neuronů s adaptivními vahami optimalizovanými pomocí backpropagation."
  },
  {
    id: "it-2",
    term: "Strojové učení",
    simple: "schopnost počítače učit se bez přímého programování",
    english: "Machine Learning",
    category: "IT & AI",
    context: "Strojové učení nám pomáhá filtrovat nevyžádanou poštu (spam).",
    level3: "Podoblast umělé inteligence zabývající se statistickými metodami a algoritmy, které detekují vzorce v trénovacích sadách."
  },
  {
    id: "it-3",
    term: "Velký jazykový model",
    simple: "pokročilý generátor textu vytrénovaný na obrovském množství dat",
    english: "Large Language Model (LLM)",
    category: "IT & AI",
    context: "Tento velký jazykový model dokáže napsat básničku i zdrojový kód.",
    level3: "Hluboká transformátorová architektura (Transformer-based decoder) s miliardami parametrů optimalizovaná pro predikci dalšího tokenu."
  },
  {
    id: "it-4",
    term: "Kryptografický hash",
    simple: "jednosměrný digitální otisk dat",
    english: "Cryptographic Hash",
    category: "IT & AI",
    context: "Kryptografický hash hesla se ukládá do databáze pro ověření identity.",
    level3: "Deterministický jednosměrný algoritmus transformující libovolný vstup na fixní bitový řetězec s vysokou rezistencí vůči kolizím."
  },
  {
    id: "med-1",
    term: "Anémie",
    simple: "chudokrevnost (nedostatek červených krvinek)",
    english: "Anemia",
    category: "Lékařství",
    context: "Pacient s anémií se může cítit unavený a bledý.",
    level3: "Patologický stav charakterizovaný snížením koncentrace hemoglobinu a erytrocytů v cirkulující krvi pod fyziologickou normu."
  },
  {
    id: "med-2",
    term: "Kardiovaskulární",
    simple: "týkající se srdce a cév",
    english: "Cardiovascular",
    category: "Lékařství",
    context: "Pravidelný pohyb snižuje kardiovaskulární rizika.",
    level3: "Komplexní anatomicko-fyziologický systém tvořený myokardem, arteriálním a venózním řečištěm zajišťující hemodynamiku."
  },
  {
    id: "med-3",
    term: "Hypertenze",
    simple: "vysoký krevní tlak",
    english: "Hypertension",
    category: "Lékařství",
    context: "Chronická hypertenze poškozuje tepny a zatěžuje levé srdce.",
    level3: "Persistentní elevace systémového arteriálního tlaku nad hodnoty 140/90 mmHg doprovázená endoteliální dysfunkcí."
  },
  {
    id: "law-1",
    term: "Jurisdikce",
    simple: "územní rozsah soudní nebo úřední moci",
    english: "Jurisdiction",
    category: "Právo",
    context: "Soud rozhodl, že tento případ nespadá pod jeho jurisdikci.",
    level3: "Právně zakotvená kompetence státního orgánu závazně aplikovat normotvorné akty a autoritativně rozhodovat právní spory."
  },
  {
    id: "law-2",
    term: "Precedent",
    simple: "předchozí soudní rozhodnutí sloužící jako vzor",
    english: "Precedent",
    category: "Právo",
    context: "V anglosaském právu má precedent sílu zákona.",
    level3: "Pramen práva představující prejudiciální autoritativní rozhodnutí soudu vyšší instance, jež je závazné pro analogické případy."
  },
  {
    id: "law-3",
    term: "Fiduciární povinnost",
    simple: "povinnost jednat s nejvyšší věrností v zájmu druhého",
    english: "Fiduciary Duty",
    category: "Právo",
    context: "Člen představenstva má fiduciární povinnost vůči akcionářům firmy.",
    level3: "Nejvyšší standard právní odpovědnosti vyžadující absolutní loajalitu, péči řádného hospodáře a potlačení střetu vlastních zájmů."
  },
  {
    id: "fin-1",
    term: "Likvidita",
    simple: "rychlost, s jakou lze majetek přeměnit na hotové peníze",
    english: "Liquidity",
    category: "Finance & Ekonomika",
    context: "Akcie velkých firem mají vysokou likviditu, nemovitosti naopak nízkou.",
    level3: "Schopnost ekonomického subjektu dostát bezprostředním splatným závazkům či míra konvertibility aktiva na univerzální platidlo s minimální ztrátou hodnoty."
  },
  {
    id: "fin-2",
    term: "Diverzifikace",
    simple: "rozdělení investic mezi více různých aktiv pro snížení rizika",
    english: "Diversification",
    category: "Finance & Ekonomika",
    context: "Diverzifikace portfolia pomáhá ochránit kapitál při propadu jednoho sektoru.",
    level3: "Strategické rozptýlení investičního rizika alokací kapitálu do vzájemně nekorelovaných tříd aktiv za účelem optimalizace Sharpeova poměru."
  },
  {
    id: "fin-3",
    term: "Inflace",
    simple: "všeobecné zdražování zboží a služeb (pokles hodnoty peněz)",
    english: "Inflation",
    category: "Finance & Ekonomika",
    context: "Vysoká inflace znehodnocuje úspory na běžných účtech.",
    level3: "Makroekonomický fenomén projevující se persistentním růstem agregátní cenové hladiny a doprovázený devalvací kupní síly monetární jednotky."
  },
  {
    id: "phil-1",
    term: "Epistemologie",
    simple: "filozofická nauka o lidském poznání",
    english: "Epistemology",
    category: "Filozofie",
    context: "Epistemologie zkoumá, jak můžeme spolehlivě odlišit pravdu od pouhého přesvědčení.",
    level3: "Gnozeologická disciplína kriticky zkoumající původ, povahu, limity, validitu a metodologické základy lidského vědění a kognice."
  },
  {
    id: "phil-2",
    term: "Solipsismus",
    simple: "názor, že existuje pouze mé vlastní vědomí",
    english: "Solipsism",
    category: "Filozofie",
    context: "Solipsismus tvrdí, že vnější svět a ostatní lidé jsou pouhou iluzí mé mysli.",
    level3: "Radikální subjektivně-idealistická metafyzická pozice postulující, že jedinou ontologickou realitou je individuální vědomí subjektu."
  },
  {
    id: "phil-3",
    term: "Heuristika",
    simple: "myšlenková zkratka pro rychlé řešení problémů",
    english: "Heuristic",
    category: "Filozofie",
    context: "Naše rozhodování v běžném životě se opírá o evolučně vyvinuté heuristiky.",
    level3: "Kognitivní zjednodušující mechanismus či neformální algoritmus, který redukuje komplexní rozhodovací procesy za cenu suboptimálního výsledku."
  }
];

// Pre-packaged training text for client-side text prediction (words autocomplete)
export const AUTOCOMPLETE_VOCABULARY = [
  "asertivita",
  "gaslighting",
  "osobní hranice",
  "pasivní agrese",
  "emoční vydírání",
  "empatie",
  "manipulace",
  "projekce",
  "aktivní naslouchání",
  "kompromis",
  "umělá inteligence",
  "umělá neuronová síť",
  "strojové učení",
  "hluboké učení",
  "velký jazykový model",
  "transformátorová architektura",
  "epistemologie",
  "heuristika",
  "likvidita",
  "diverzifikace",
  "inflace",
  "jurisdikce",
  "fiduciární povinnost",
  "anémie",
  "hypertenze",
  "kryptografický hash",
  "optimalizace",
  "prompt engineering",
  "databáze",
  "algoritmus",
  "šifrování",
  "bezpečnost",
  "soukromí",
  "analyzovat",
  "přeložit",
  "zjednodušit",
  "pochopit",
  "predikce textu",
  "smyčka",
  "automatizace",
  "výsledky",
  "přeformulovat",
  "vzdělaný člověk",
  "expertní analýza",
  "abstraktní myšlení",
  "vědecká studie",
  "metodologie",
  "statistický význam"
];
