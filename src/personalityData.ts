export interface PatientStatement {
  id: string;
  date: string;
  statement: string; // Co řekli / napsali
  unconsciousBehavior: string; // Co si dotyčný neuvědomuje
  calmResponse: string; // Doporučená klidná odpověď
  strategyNotes?: string; // Terapeutická strategie
}

export interface PersonalityCategory {
  id: string;
  title: string;
  dsmCode?: string;
  badgeColor: string;
  shortDescription: string;
  psychiatristNotes: string; // Psychiatrický profil a poznámky
  communicationDos: string[]; // Tipy jak komunikovat
  communicationDonts: string[]; // Jaké chyby NIKDY nedělat
  calmHelpStrategy: string; // Jak být k pomoci a jak odpovídat v klidu
  patientStatements: PatientStatement[]; // Záznamy výpovědí a doporučených odpovedí
}

export interface InterrogationQuestion {
  id: number;
  title: string;
  category: "Scénář" | "Logická Hádanka" | "Reakce na Stres" | "Ego & Morálka";
  type: "scenario" | "riddle" | "behavior" | "morality";
  question: string;
  placeholder: string;
  options?: { label: string; text: string; trait: string }[];
}

export const INTERROGATION_QUESTIONS: InterrogationQuestion[] = [
  {
    id: 1,
    title: "1. Reakce na chybné obvinění před kolegy",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Když vás někdo nepravdivě obviní z chyby na dôležité poradě nebo před skupinou, jaká je vaše okamžitá vnitřní reakce a první slova?",
    placeholder: "Popište první reakci (např. 'Okamžitě ostrá defenziva a útok na dotyčného' nebo 'Zmlknu a analyzuji fakta'...)",
    options: [
      { label: "A", text: "Okamžitě přeruším dotyčného a agresivně/rázně očistím své jméno.", trait: "Ego a Narcismus" },
      { label: "B", text: "Zůstanu ledově klidný, zaznamenám si fakta a vyvrátím to důkazy.", trait: "Racionálně-Analytický" },
      { label: "C", text: "Cítím hlubokou ublíženost, stáhnu se a vyhnu se konfrontaci.", trait: "Vyhýbavý/Úzkostný" },
      { label: "D", text: "Odpovím ironickou poznámkou 'Jak myslíš' a vnitřně si plánuji odplatu.", trait: "Pasivně-Agresivní" }
    ]
  },
  {
    id: 2,
    title: "2. Logická hádanka: 3 Spínače a Žárovky",
    category: "Logická Hádanka",
    type: "riddle",
    question: "Máte 3 spínače venku a 3 žárovky v uzavřené místnosti. Do místnosti můžete vstoupit pouze JEDNOU. Jak zjistíte, který spínač patří ke které žárovce?",
    placeholder: "Uveďte váš postup řešení hádanky...",
    options: [
      { label: "A", text: "Zapnu spínač 1 na 10 minut (zahřeje se), pak ho vypnu, zapnu spínač 2 a vejdu. Rozsvícená = 2, teplá = 1, studená = 3.", trait: "Vysoká logika" },
      { label: "B", text: "Náhodně přepnu spínače a zkusím štěstí.", trait: "Impulzivnost" },
      { label: "C", text: "Tato hádanka je chyták, nehodlám marnit čas plněním cizích pravidel.", trait: "Antiautoritářství" }
    ]
  },
  {
    id: 3,
    title: "3. Pohled na vlastní selhání a nezdar",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Když se vám nepodaří dosáhnout plánovaného cíle, jak si v duchu odůvodníte příčinu tohoto nezdaru?",
    placeholder: "Hledáte chybu v sobě, ve špatných podmínkách, nebo v neschopnosti druhých?",
    options: [
      { label: "A", text: "Chyba byla v neschopnosti okolí a špatných podmínkách, já udělal maximum.", trait: "Externalizace chyb / Narcismus" },
      { label: "B", text: "Chyba je výhradně ve mně, jsem neschopný a selhal jsem.", trait: "Depresivní/Úzkostný" },
      { label: "C", text: "Provedu chladnou retrospektivu, identifikuji systémovou chybu a upravím proces.", trait: "Obsedantně-Analytický" }
    ]
  },
  {
    id: 4,
    title: "4. Změna názoru po kritice",
    category: "Scénář",
    type: "scenario",
    question: "Kdy jste naposledy před někým přiznal, že jste se mýlil, a kompletně změnil svúj názor na základě jeho argumentů?",
    placeholder: "Popište situaci nebo uveďte, jak těžké je pro vás přiznat omyl...",
    options: [
      { label: "A", text: "Pamatuji si to přesně, data mě přesvědčila a nemám problém uznat fakta.", trait: "Flexibilita" },
      { label: "B", text: "Téměř nikdy se nemýlím, obvykle jen druhý pochopil věc z mého úhlu pohledu.", trait: "Rigidita/Ego" },
      { label: "C", text: "Přiznám to raději hned, abych měl pokoj od hádky.", trait: "Submisivita" }
    ]
  },
  {
    id: 5,
    title: "5. Morální test: Tramvaj a Příkaz Autority",
    category: "Ego & Morálka",
    type: "morality",
    question: "Tramvaj se řítí na 5 lidí. Můžete přehodit výhybku na 1 člověka. Autorita vám ale pod hrozbou přísného trestu přikazuje výhybku NENEDÍROVAT. Co uděláte?",
    placeholder: "Zachránite 5 lidí i za cenu porušení příkazu autority?",
    options: [
      { label: "A", text: "Přehodím výhybku – zachránit 5 životů má absolutní prioritu před jakýmkoliv příkazem.", trait: "Utilitarismus/Odvaha" },
      { label: "B", text: "Poslechnu příkaz autority, nechci nést osobní odpovědnost za porušení pravidel.", trait: "Konformismus/Strach" },
      { label: "C", text: "Zablokuji koleje něčím jiným nebo najdu třetí nestandardní řešení.", trait: "Kreativní obcházení" }
    ]
  },
  {
    id: 6,
    title: "6. Reakce na nezasloužený obdiv druhého",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Jak reagujete, když kolega nebo známý sklidí obrovský obdiv za práci, kterou vy považujete za průměrnou nebo podřadnou?",
    placeholder: "Pociťujete závist, opovržení, nebo lhostejnost?",
    options: [
      { label: "A", text: "Cítím vnitřní hněv a přiměřeně upozorním ostatní na nedostatky jeho práce.", trait: "Závist/Rivalita" },
      { label: "B", text: "Popsaného obdivu si nevšímám, zaměřuji se výhradně na své výsledky.", trait: "Autonomie" },
      { label: "C", text: "Veřejně ho pochválím, ale v duchu si o něm a publiku myslím své.", trait: "Falešná sociabilita" }
    ]
  },
  {
    id: 7,
    title: "7. Logická hádanka: Dvě brány a lháři",
    category: "Logická Hádanka",
    type: "riddle",
    question: "Dvě brány – jedna k pravdě, druhá ke zkáze. Dva strážní: jeden vždy lže, druhý vždy mluví pravdu. Máte JEDINOU otázku na jednoho ze strážných. Jaká zní?",
    placeholder: "Jakou otázku položíte pro bezpečný průchod?",
    options: [
      { label: "A", text: "'Kterou bránu by mi doporučil ten druhý strážce k pravdě?' (A pak zvolím OPAČNOU bránu).", trait: "Správné logické řešení" },
      { label: "B", text: "Zeptám se, zda je strážce poctivý člověk.", trait: "Naivní logika" },
      { label: "C", text: "Neptám se a projdu silou.", trait: "Dominance" }
    ]
  },
  {
    id: 8,
    title: "8. Nečekaný rozpad naplánovaného harmonogramu",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Když se váš detailně naplánovaný harmonogram na celý týden během 5 minut kompletně zhroutí kvůli nedochvilnosti někoho jiného, co uděláte?",
    placeholder: "Jak reagujete na ztrátu kontroly nad časem?",
    options: [
      { label: "A", text: "Propadnu masivní frustraci a hrubě dotyčnému vytknu jeho nekompetenci.", trait: "Obsedantně-Kompulzivní (OCPD)" },
      { label: "B", text: "Improvizuji, sestavím nový plán během chvíle.", trait: "Adaptabilita" },
      { label: "C", text: "Zruším vše a zalezu do ústraní.", trait: "Depresivní stažení" }
    ]
  },
  {
    id: 9,
    title: "9. Manipulační test: Citové vydírání a prosba",
    category: "Scénář",
    type: "scenario",
    question: "Známý vás žádá o výhodný ústupek a používá věty typu 'Myslel jsem, že jsme kamarádi, když mi nepomůžeš, zničíš mi život'. Jak zareagujete?",
    placeholder: "Jak nastavujete hranice vůči manipulaci?",
    options: [
      { label: "A", text: "Nenechám se vydírat. Vlídně ale nekompromisně odmítnu s odkazem na své hranice.", trait: "Zdravá asertivita" },
      { label: "B", text: "Povolím a pomohu, i když mě to zruinuje, ze strachu z viny.", trait: "Ko-závislost / Zranitelnost" },
      { label: "C", text: "Začnu ho citově vydírat zpátky ještě těžšími kalibry.", trait: "Machiavellismus" }
    ]
  },
  {
    id: 10,
    title: "10. Sebehodnocení: Štěpná vlastnost",
    category: "Ego & Morálka",
    type: "behavior",
    question: "Jaká vaše vlastnost nejvíce štve vaše blízké, i když vy si myslíte, že je pro vás vlastně užitečná?",
    placeholder: "Např. nekompromisní perfekcionismus, chladná racionalita, dominance...",
    options: [
      { label: "A", text: "Moje absolutní neústupnost v logice a detailu.", trait: "Perfekcionismus" },
      { label: "B", text: "Moje tendence všechno kontrolovat a řídit.", trait: "Potřeba kontroly" },
      { label: "C", text: "Moje ironie a sarkasmus.", trait: "Obranný sarkasmus" }
    ]
  },
  {
    id: 11,
    title: "11. Test pasivní agrese: Zpráva 'Jak myslíš.'",
    category: "Reakce na Stres",
    type: "scenario",
    question: "Jak reagujete, když vám partner nebo kolega po vaší argumentaci napíše jen chladné 'Jak myslíš.' a přestane odpovídat?",
    placeholder: "Jak reagujete na tichou domácnost a pasivní odpor?",
    options: [
      { label: "A", text: "Ignoruji to, je to jeho dětský způsob komunikace.", trait: "Netečnost" },
      { label: "B", text: "Začnu pociťovat masivní úzkost a snažím se ho prosit o vysvětlení.", trait: "Strach z opuštění (BPD)" },
      { label: "C", text: "Klidně pojmenuji fakta: 'Vidím, že nesouhlasíš. Až budeš chtít mluvit věcně, jsem tu.'", trait: "Deeskalační kompetence" }
    ]
  },
  {
    id: 12,
    title: "12. Logická hádanka: Wasonův test 4 karet",
    category: "Logická Hádanka",
    type: "riddle",
    question: "Máte 4 karty: [A], [B], [4], [7]. Pravidlo: 'Pokud je na jedné straně samohláska, na druhé musí být sudé číslo.' Které karty MUSÍTE otočit?",
    placeholder: "Které karty zvolíte pro ověření pravidla?",
    options: [
      { label: "A", text: "Karty [A] a [7] (Ověření platnosti samohlásky a test nevyskytující se lichosti).", trait: "Excelentní logika" },
      { label: "B", text: "Karty [A] a [4].", trait: "Konfirmační zkreslení" },
      { label: "C", text: "Všechny 4 karty.", trait: "Nadbytečný alibismus" }
    ]
  },
  {
    id: 13,
    title: "13. Vztah k zákonům a pravidlům",
    category: "Ego & Morálka",
    type: "morality",
    question: "Za jakých okolností považujete za zcela v pořádku obcházet nebo porušovat oficiální pravidla a předpisy?",
    placeholder: "Kdy jsou pravidla jen 'doporučením'?",
    options: [
      { label: "A", text: "Když mě pravidla zpomalují v dosahování mých výjimečných cílů.", trait: "Antisociální / Narcistický" },
      { label: "B", text: "Jen v případě ohrožení zdraví či života.", trait: "Respekt k řádu" },
      { label: "C", text: "Pravidla se mají dodržovat vždy bez výjimky.", trait: "Rigidní obsedantismus" }
    ]
  },
  {
    id: 14,
    title: "14. Zranitelnost a sdílení tísně",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Kdy jste se naposledy před někým cítil zranitelný nebo v tísni a jak jste na tuto situaci reagoval vůči svému okolí?",
    placeholder: "Dokážete si říct o pomoc, nebo nasadíte masku silného jedince?",
    options: [
      { label: "A", text: "Nikdy nedávám najevo slabost, lidé by to využili proti mně.", trait: "Paranoidní obrana" },
      { label: "B", text: "Mám úzkou skupinu lidí, kterým se mohu bez obav svěřit.", trait: "Zdravé vazby" },
      { label: "C", text: "Snažím se vše vyřešit sám do úmoru.", trait: "Hyper-kompenzace" }
    ]
  },
  {
    id: 15,
    title: "15. Spouštěč nekontrolovatelného hněvu",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Co ve vás dokáže během sekundy vyvolat pocit hlubokého ponížení nebo náhlý výbuch hněvu?",
    placeholder: "Která věta či jednání je váš největší emociální spouštěč?",
    options: [
      { label: "A", text: "Když zpochybňují mou inteligenci nebo schopnosti.", trait: "Zranitelné ego" },
      { label: "B", text: "Když mě někdo ignoruje nebo se mnou jedná jako s neschopným.", trait: "Deprivace uznání" },
      { label: "C", text: "Když někdo vědomě lže a podvádí.", trait: "Morální spravedlnost" }
    ]
  },
  {
    id: 16,
    title: "16. Logická hádanka: Monty Hallův problém",
    category: "Logická Hádanka",
    type: "riddle",
    question: "Vyberete si 1 ze 3 dveří (za 1 je auto, za 2 kozy). Moderátor otevře jiné dveře s kozou a nabídne vám změnu na zbývající dveře. Změníte volbu?",
    placeholder: "Změníte dveře nebo zůstanete u původních? Jaká je šance?",
    options: [
      { label: "A", text: "Změním dveře! Šance na výhru se zvýší z 1/3 na 2/3.", trait: "Pravděpodobnostní logika" },
      { label: "B", text: "Nezměním, šance je stále 50/50.", trait: "Intuice bez výpočtu" },
      { label: "C", text: "Nevěřím moderátorovi, snaží se mě podfouknout.", trait: "Podezřívavost" }
    ]
  },
  {
    id: 17,
    title: "17. Ustoupení v hádce při 100% pravdě",
    category: "Ego & Morálka",
    type: "scenario",
    question: "Popište situaci, kdy raději ustoupíte v hádce a necháte druhého při jeho omylu, i když víte s 100% jistotou, že máte pravdu.",
    placeholder: "Dokážete nechat druhého zvítězit pro zachování klidu?",
    options: [
      { label: "A", text: "Udělám to běžně, pokud věc nemá reálné dopady – 'Chceš mít pravdu, nebo klid?'", trait: "Zralost/Neehoismus" },
      { label: "B", text: "Nikdy neustoupím. Pravda musí zvítězit za každou cenu.", trait: "Dogmatismus/Ego" },
      { label: "C", text: "Ustoupím, ale v duchu dotyčným opovrhuji.", trait: "Tichá nadřazenost" }
    ]
  },
  {
    id: 18,
    title: "18. Paranoia test: Tiše se smějící lidé",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Když vstoupíte do místnosti a dva lidé se tiše smějí a podívají se vaším směrem, jaká myšlenka vám probleskne hlavou?",
    placeholder: "Myslíte si, že se smějí vám, nebo řeší své věci?",
    options: [
      { label: "A", text: "Určitě mě pomlouvají nebo se mi smějí.", trait: "Paranoidní/Vztahovačný" },
      { label: "B", text: "Řeší svůj vtip, já s tím nemám nic společného.", trait: "Objektivní nadhled" },
      { label: "C", text: "Jdu k nim a s úsměvem se zeptám, co je tak vtipného.", trait: "Extrovertní sebedůvěra" }
    ]
  },
  {
    id: 19,
    title: "19. Reakce na chaos a nedokončenou práci",
    category: "Reakce na Stres",
    type: "behavior",
    question: "Jak se cítíte, když kolem vás v práci nebo doma zůstane nedokončená, chaotická nebo nepřesná práce někoho jiného?",
    placeholder: "Musíte to okamžitě opravit sami, nebo dokážete v klidu odejít?",
    options: [
      { label: "A", text: "Nemohu to vystát. Okamžitě to předělám do perfektního stavu sám.", trait: "Obsedantní kontrola" },
      { label: "B", text: "Upozorním autora, ať si to dokončí, nesu odpovědnost jen za své věci.", trait: "Zdravá hranice" },
      { label: "C", text: "Využiji jeho chyb k tomu, abych ukázal svou nadřazenost.", trait: "Obranná kalkulace" }
    ]
  },
  {
    id: 20,
    title: "20. Projekce budoucnosti a smyslu",
    category: "Ego & Morálka",
    type: "scenario",
    question: "Kdyby vám zbývalo 5 let života a mohl jste změnit jedinou věc na svém současném chování k druhým lidem, co by to bylo?",
    placeholder: "Jaká je vaší nejvyšší hodnotou v mezilidských vztazích?",
    options: [
      { label: "A", text: "Chtěl bych mít více trpělivosti a projevovat více vřelosti.", trait: "Empatická sebereflexe" },
      { label: "B", text: "Neměnil bych nic, žiji přesně tak, jak je správné.", trait: "Narcistická nezranitelnost" },
      { label: "C", text: "Méně bych se bál toho, co si o mně myslí ostatní.", trait: "Úzkostná tenze" }
    ]
  }
];

export const INITIAL_PERSONALITY_CATEGORIES: PersonalityCategory[] = [
  {
    id: "narcissistic",
    title: "Narcisticko-Grandiózní typ",
    dsmCode: "DSM-5 301.81 (NPD)",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    shortDescription: "Potřeba obdivu, křehké ego pod maskou síly, absence hluboké empatie, citlivost na jakoukoliv kritiku.",
    psychiatristNotes: `KLINICKÝ PROFIL PSYCHIATRA:
Osoba vykazuje grandiózní sebehodnocení s kompenzačním obranným mechanizmem proti hlubokému vnitřnímu pocitu méněcennosti.

KLÍČOVÉ TRAITY:
- Masivní štěpení (splittting): Lidé jsou buď 'geniální' nebo 'zcela neschopní'.
- Citlivost na narcistické zranění (Narcissistic Injury): Běžná nesouhlasná poznámka je vnímána jako zničující osobní útok.
- Projektivní identifikace: Své vlastní chyby okamžitě přepisuje na komunikačního partnera.

KLINICKÉ DOPORUČENÍ:
Nikdy nevstupujte do přímé konfrontace o pravdu. Udržujte profesní odstup a validujte jeho potřebu uznání před formulací požadavků.`,
    communicationDos: [
      "Používejte techniku 'Sandwich': Pochvala/Uznání ➜ Věcný požadavek ➜ Ocenění přínosu.",
      "Validujte jeho pocity, aniž byste potvrzovali jeho překroucená fakta ('Rozumím, že tě tato situace rozzlobila').",
      "Předkládejte návrhy tak, aby z nich měl pocit, že jsou jeho vlastním nápadem."
    ],
    communicationDonts: [
      "NIKDY veřejně nekritizujte jeho chyby před ostatními (vyvolá to masivní vztek či tichou pomstu).",
      "Vyhněte se ironii a sarkasmu – narcistické ego sarkasmus dešifruje jako útok na existenci.",
      "Nezpochybňujte jeho kompetenci ani inteligenci přímo."
    ],
    calmHelpStrategy: "Abyste dotyčného udrželi v klidu, zachovejte klidný, respektující tón. Dejte mu najevo, že je vnímán a respektován. Přidejte slova jako 'Vážím si tvého pohledu, pojďme najít nejlepší řešení'.",
    patientStatements: [
      {
        id: "stmt-1",
        date: "2026-08-01",
        statement: "Všichni v týmu jsou úplní amatéři, bez mých nápadů by se celý projekt během jednoho dne zhroutil!",
        unconsciousBehavior: "Dotyčný si neuvědomuje svou vlastní úzkost ze selhání a zakrývá svou závislost na týmu přehnanou grandiozitou.",
        calmResponse: "Tvá práce na projektu má obrovský přínos a všichni vidíme tvé nasazení. Pojďme společně nastavit rozdělení úkolů tak, aby ses nemusel cítit přetížený.",
        strategyNotes: "Aproch: Validace přínosu + odlehčení tlaku."
      }
    ]
  },
  {
    id: "borderline",
    title: "Hraniční / Emočně-Nestabilní typ",
    dsmCode: "DSM-5 301.83 (BPD)",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    shortDescription: "Masivní strach z opuštění, extremní emoční výkyvy, černobílé vidění světa (idealizace vs. devalvace).",
    psychiatristNotes: `KLINICKÝ PROFIL PSYCHIATRA:
Masivní emoční dysregulace. Jedinec prožívá mezilidské vztahy s extrémní intenzitou. Chybí mu vnitřní pocit stabilní identity.

KLÍČOVÉ TRAITY:
- Strach z opuštění: Jakékoliv zpoždění odpovědi si vykládá jako definitivní odmítnutí.
- Afektivní labilita: Během minut přechází z euforie do bezbřehého hněvu či zoufalství.
- Testování hranic: Neustále zkouší, zda nad ním druhý 'zlomil hůl'.

KLINICKÉ DOPORUČENÍ:
Být emociálním majákem – nevstřebávat jeho emoční bouři, držet pevné, ale extrémně vřelé a konzistentní hranice.`,
    communicationDos: [
      "Bojujte proti strachu z opuštění jasným ubezpečením ('Jsem tu s tebou a neodcházím, i když se teď neshodneme').",
      "Používejte extrémně klidný, tichý a pomalý hlas.",
      "Stanovte jasné časové a osobní hranice bez výčitek."
    ],
    communicationDonts: [
      "Nereagujte na jeho emoční výbuchy stejným hněvem ani chladným odtažením.",
      "Nenechte se vmanipulovat do situace 'Všechno nebo nic'.",
      "Neslibujte věci, které nemůžete 100% dodržet."
    ],
    calmHelpStrategy: "Mluvte s ním z pozice neotřesitelné jistoty a vřelosti. Opakujte: 'Rozumím tvé bolesti. Jsme v bezpečí a vyřešíme to krok za krokem.'",
    patientStatements: [
      {
        id: "stmt-2",
        date: "2026-08-02",
        statement: "Odpověděl jsi mi až za dvě hodiny! Je mi jasné, že už pro tebe nic neznamenám a chceš mě opustit!",
        unconsciousBehavior: "Dotyčný prožívá panický strach ze ztráty bezpečí a pohlcuje ho katastrofický scénář bez logického podkladu.",
        calmResponse: "Jsem tady s tebou a naše přátelství/vztah je pro mě důležitý. Dvě hodiny jsem byl na jednání, ale jakmile jsem mohl, napsal jsem ti. Není důvod k obavám.",
        strategyNotes: "Kombinace ubezpečení o vztahu + věcné vysvětlení bez defenzivy."
      }
    ]
  },
  {
    id: "passive-aggressive",
    title: "Pasivně-Agresivní typ",
    dsmCode: "ICD-10 F60.81",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    shortDescription: "Skrytý odpor k požadavkům, tichá domácnost, sarkasmus, zapomínání úkolů jako forma protestu.",
    psychiatristNotes: `KLINICKÝ PROFIL PSYCHIATRA:
Osoba má potlačený hněv a strach z přímé konfrontace. Vyjadřuje nesouhlas skrytě skrz obstrukce, odkládání a tichou ignoraci.

KLÍČOVÉ TRAITY:
- Slovní souhlas + praktický bojkot ('Ano udělám to', ale úkol vědomě prošvihne).
- Tichá domácnost a věty typu 'Nic mi není', 'Dělej si co chceš'.
- Hra na oběť: Přestavuje se jako ten, kdo je neustále utlačován autoritou.

KLINICKÉ DOPORUČENÍ:
Pojmenovávat rozpor mezi slovy a činy bez hněvu. Pokládat uzavřené otazníky zaměřené na konkrétní akce.`,
    communicationDos: [
      "Oceňujte jakýkoliv přímý vyjádřený nesouhlas ('Jsem rád, že mi říkáš narovinu, co se ti nelíbí').",
      "Pojmenovávejte fakta věcně a chladně ('Sliboval jsi to v úterý, dnes je čtvrtek').",
      "Ptejte se na jeho konkrétní návrhy řešení."
    ],
    communicationDonts: [
      "Nenechte se vyprovokovat k výbuchu hněvu – to je přesně cíl jeho pasivní agrese (chce abyste vy byl za zlosyna).",
      "Nereagujte na ironické 'Jak myslíš' další ironií.",
      "Předpokládat, že jeho 'Ano' znamená reálný souhlas."
    ],
    calmHelpStrategy: "Udržujte klidné tempo a nedovolte mu sklouznout k tiché ignoraci. Vyzvěte ho s úsměvem k přímé diskusi: 'Slyším 'jak myslíš', ale chci znát tvůj reálný názor.'",
    patientStatements: [
      {
        id: "stmt-3",
        date: "2026-08-02",
        statement: "Aha, jasně... dělej si to po svém, moje názory stejně nikoho nezajímají.",
        unconsciousBehavior: "Dotyčný se vyhýbá odpovědnosti za konstruktivní diskusi a snaží se ve vás vyvolat pocit viny.",
        calmResponse: "Tvůj názor mě naopak velmi zajímá, proto se tě ptám. Chci slyšet tvůj konkrétní návrh, abychom našli dohodu, se kterou budeme oba spokojeni.",
        strategyNotes: "Odzbrojení pasivní agrese přímou výzvou k dialogu."
      }
    ]
  },
  {
    id: "anxious-paranoid",
    title: "Úzkostně-Paranoidní typ",
    dsmCode: "DSM-5 301.0 (PPD)",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    shortDescription: "Všudypřítomná nedůvěra, předpoklad zlého úmyslu u druhých, hledání skrytých hrozeb a spiknutí.",
    psychiatristNotes: `KLINICKÝ PROFIL PSYCHIATRA:
Osoba trpí vysokou hladinou vnitřního ohrožení a chronické úzkosti. Svět vnímá jako nepřátelské místo plné klamu.

KLÍČOVÉ TRAITY:
- Nadměrná ostražitost (hypervigilance).
- Hledání skrytých významů v běžných gestech či větách.
- Dlouho si pamatuje domnělé křivdy a odmítá odpuštění.

KLINICKÉ DOPORUČENÍ:
Absolutní transparentnost. Žádné tajemství, šeptání nebo nejasné dohody. Vše formulovat otevřeně a písemně.`,
    communicationDos: [
      "Buďte 100% předvídatelní a transparentní v jednání.",
      "Dodejte písemná fakta a jasné podklady pro každé své tvrzení.",
      "Uznávejte jeho obavy jako reálné pocity ('Chápu, že máš strach z rizika')."
    ],
    communicationDonts: [
      "Nikdy nesdílejte tajné informace za jeho zády.",
      "Nezesměšňujte jeho obavy a teorii o zlém úmyslu.",
      "Nezamlčujte drobné detaily (vyloží si to jako vědomý podvod)."
    ],
    calmHelpStrategy: "Mluvte otevřeně bez dvojitých smyslů. Mějte otevřenou řeč těla. Ukazujte fakta: 'Zde jsou všechny dokumenty a čísla, můžeš si je v klidu prostudovat.'",
    patientStatements: [
      {
        id: "stmt-4",
        date: "2026-08-03",
        statement: "Určitě jste se na tom schválně domluvili beze mě, abyste mě vyšachovali z vedení projektu!",
        unconsciousBehavior: "Projektuje svůj vnitřní strach z bezmoci do smyšleného spiknutí okolí.",
        calmResponse: "Rozumím tvému znepokojení. Schůzka byla narychlo kvůli technickému výpadku a zde ti posílám kompletní zápis. Chceme tě v týmu a tvá role na vedení projektu trvá.",
        strategyNotes: "Transparentnost + dodání podkladů + ubezpečení o pozici."
      }
    ]
  },
  {
    id: "obsessive-compulsive",
    title: "Obsedantně-Kompulzivní typ (OCPD)",
    dsmCode: "DSM-5 301.4 (OCPD)",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    shortDescription: "Extrémní potřeba kontroly, detailů, řádu a pravidel. Neschopnost delegovat a přizpůsobit se změně.",
    psychiatristNotes: `KLINICKÝ PROFIL PSYCHIATRA:
Osoba staví svůj vnitřní klid na vnějším dokonalém řádu. Ztráta kontroly nad detaily u ní vyvolává masivní paniku disguised jako hněv.

KLÍČOVÉ TRAITY:
- Perfekcionismus brzdící dokončení práce.
- Tuhý respekt k předpisům a pravidlům.
- Neschopnost delegovat úkoly z obavy, že je druhý udělají špatně.

KLINICKÉ DOPORUČENÍ:
Restrukturovat jeho pohled – ukázat mu, že uvolnění kontroly je ziskem efektivity, nikoliv selháním.`,
    communicationDos: [
      "Oceňte jeho preciznost a zmysel pro detail.",
      "Dávejte mu dostatek času na přípravu a rozbor struktury.",
      "Informujte ho o změnách s velkým časovým předstihem."
    ],
    communicationDonts: [
      "Nenabízejte chaotická a nepromyšlená řešení na poslední chvíli.",
      "Nenechte se znechutit jeho neustálou opravou vašich chyb.",
      "Nenutit ho k okamžité improvizaci bez podkladů."
    ],
    calmHelpStrategy: "Mluvte strukturovaně v odrážkách a číslech. Ukažte mu přesný harmonogram a pravidla: 'Postupujeme přesně podle bodů 1, 2 a 3.'",
    patientStatements: [
      {
        id: "stmt-5",
        date: "2026-08-03",
        statement: "Ten dokument má špatně zarovnané nadpisy a chybnou velikost písma! To nemůžeme v žádném případě odeslat!",
        unconsciousBehavior: "Přenáší svou úzkost z neperfektnosti na formální detaily, které nemají vliv na věcnou podstatu.",
        calmResponse: "Díky za tvé skvělé oko pro detail! Opravíme zarovnání a pak to odešleme. Tvá pečlivost nám pomáhá držet vysoký standard.",
        strategyNotes: "Ocenění pečlivosti + věcná náprava bez odporu."
      }
    ]
  },
  {
    id: "avoidant-schizoid",
    title: "Vyhýbavě-Introvertní / Schizoidní typ",
    dsmCode: "DSM-5 301.82 (AVPD)",
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    shortDescription: "Stahování se do sebe, masivní obava z odmítnutí a kritiky, preference písemného kontaktu.",
    psychiatristNotes: `KLINICKÝ PROFIL PSYCHIATRA:
Silná sociální úzkost spojená s touhou po přijetí, zakrytá maskou chladného nezájmu nebo samotářství.

KLÍČOVÉ TRAITY:
- Vyhýbání se osobním konfrontacím a veřejným vystoupením.
- Dlouhá doba potřebná pro zpracování sociálních podnětů.
- Strach ze znemožnění před skupinou.

KLINICKÉ DOPORUČENÍ:
Dát mu bezpečný sociální prostor. Preferovat asynchronní (písemnou) komunikaci a netlačit na veřejné projevy.`,
    communicationDos: [
      "Komunikujte primárně písemně nebo v soukromém rozhovoru mezi 4 očima.",
      "Dejte mu čas na rozmyšlenou bez tlaku na okamžitou reakci.",
      "Pochvalte ho v soukromí, nikoliv okázale před skupinou."
    ],
    communicationDonts: [
      "Nenutit ho vyjadřovat emoce na počkání na veřejnosti.",
      "Nevystavovat ho neočekávané pozornosti skupiny.",
      "Neforcing osobního kontaktu, pokud preferuje odstup."
    ],
    calmHelpStrategy: "Mluvte klidným, tichým tónem. Nabídněte možnost napsat názor zprávou: 'Není spěch, v klidu si to rozmysli a pošli mi své vyjádření e-mailem.'",
    patientStatements: [
      {
        id: "stmt-6",
        date: "2026-08-03",
        statement: "Já k tomu na té poradě raději nic říkat nebudu, stejně by to nikoho nezajímalo...",
        unconsciousBehavior: "Má hluboko zakořeněný strach ze zesměšnění a raději volí dobrovolnou izolaci.",
        calmResponse: "Tvé myšlenky jsou pro nás velmi cenné. Pokud nechceš mluvit před celou skupinou, napiš mi své body do zprávy a já je rád přednesu za tebe nebo je probereme v soukromí.",
        strategyNotes: "Snížení sociální úzkosti + nabandážování bezpečného kanálu."
      }
    ]
  }
];

// Offline fallback evaluator for 20 questions
export function evaluateInterrogationOffline(answers: { id: number; question: string; answer: string }[]) {
  // Compute basic scores based on selected option traits or answer text
  let egoScore = 50;
  let emotionalStabilityScore = 60;
  let passiveAggressiveScore = 40;
  let analyticalScore = 70;
  let paranoiaScore = 30;

  const combinedText = answers.map(a => a.answer.toLowerCase()).join(" ");

  if (combinedText.includes("autorit") || combinedText.includes("ego") || combinedText.includes("chyba byla v neschopnosti") || combinedText.includes("přeruším") || combinedText.includes("nemýlím")) {
    egoScore += 30;
  }
  if (combinedText.includes("jak myslíš") || combinedText.includes("tichá") || combinedText.includes("oběť") || combinedText.includes("obstrukce")) {
    passiveAggressiveScore += 35;
  }
  if (combinedText.includes("spínač") || combinedText.includes("stráž") || combinedText.includes("wason") || combinedText.includes("monty") || combinedText.includes("zahřeje") || combinedText.includes("karty")) {
    analyticalScore += 25;
  }
  if (combinedText.includes("pomlouvají") || combinedText.includes("smějí") || combinedText.includes("spiknutí") || combinedText.includes("nikdy nedávám") || combinedText.includes("vymezení")) {
    paranoiaScore += 35;
  }
  if (combinedText.includes("zhroutí") || combinedText.includes("frustraci") || combinedText.includes("výbuch") || combinedText.includes("hněv") || combinedText.includes("všechno nebo nic")) {
    emotionalStabilityScore -= 30;
  }

  // Determine primary and secondary categories
  let primaryCategory = "Racionálně-Analytický typ";
  let secondaryCategory = "Obsedantně-Kompulzivní typ";

  if (egoScore > 70) {
    primaryCategory = "Narcisticko-Grandiózní typ";
    secondaryCategory = paranoiaScore > 50 ? "Úzkostně-Paranoidní typ" : "Pasivně-Agresivní typ";
  } else if (emotionalStabilityScore < 40) {
    primaryCategory = "Hraniční / Emočně-Nestabilní typ";
    secondaryCategory = "Vyhýbavě-Introvertní typ";
  } else if (passiveAggressiveScore > 65) {
    primaryCategory = "Pasivně-Agresivní typ";
    secondaryCategory = "Narcisticko-Grandiózní typ";
  } else if (paranoiaScore > 60) {
    primaryCategory = "Úzkostně-Paranoidní typ";
    secondaryCategory = "Hraniční / Emočně-Nestabilní typ";
  }

  return {
    primaryCategory,
    secondaryCategory,
    summary: `Na základě rozboru 20 otázek a logických úloh vykazuje testovaná osoba výrazné rysy (${primaryCategory}). Vykazuje specifické obranné mechanizmy při zvládání stresu a konfrontace s autoritou.`,
    psychiatricDiagnosis: `KLINICKÝ ZÁVĚR (Offline Diagnostika):\nOsoba projevuje kognitivní styl orientovaný na ${analyticalScore > 75 ? "vysokou analytiku a hledání logických vzorců" : "emoční reakce a obranu ega"}. Při zvýšeném tlaku nebo nezdaru aktivuje ${passiveAggressiveScore > 50 ? "pasivně-agresivní obstrukce" : "defenzivní sebeobhajobu"}.`,
    traitScores: [
      { trait: "Ego a Narcismus", score: Math.min(100, egoScore), description: "Míra zaměření na vlastní nadřazenost a obranu autority." },
      { trait: "Emoční stabilita", score: Math.max(10, emotionalStabilityScore), description: "Schopnost zachovat klid v krizových a nečekaných situacích." },
      { trait: "Pasivní agresivita", score: Math.min(100, passiveAggressiveScore), description: "Sklon vyjadřovat nesouhlas nepřímo a tichým odporem." },
      { trait: "Analytické myslení", score: Math.min(100, analyticalScore), description: "Schopnost dedukce a řešení systémových hádanek." },
      { trait: "Paranoia a nedůvěra", score: Math.min(100, paranoiaScore), description: "Míra předpokladu zlého úmyslu u okolí." }
    ],
    communicationDos: [
      "Mluvte vždy věcně, s klidným tónem a doložitelnými fakty.",
      "Používejte techniku validace emocí dříve, než začnete korigovat chování.",
      "Dávejte jasné, nesouznivé hranice bez osobního hněvu."
    ],
    communicationDonts: [
      "Nikdy nesnižujte jeho důstojnost ani nekritizujte jeho osobu před skupinou.",
      "Nenechte se vtáhnout do pasivně-agresivní tiché domácnosti.",
      "Vyhněte se nejasným slibům a nepředvídatelným změnám na poslední chvíli."
    ],
    calmStrategy: "Mluvte s osobou s maximálním klidem a respektem. Vyvarujte se emocí a útoků na ego, čímž udržíte dotyčného v úplném klidu.",
    detailedAnalysis: "Analýza hádanek ukázala schopnost strukturovaného myšlení, avšak v oblasti mezilidských vztahů vystupují do popředí silné obranné reakce."
  };
}
