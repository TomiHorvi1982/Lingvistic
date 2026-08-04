export interface ModelSituation {
  id: string;
  title: string;
  level: "calm" | "medium" | "escalated" | "extreme";
  levelLabel: string;
  contextDescription: string;
  initialStatement: string;
  initialTension: number; // 0 - 100%
  speechTone: {
    pitch: number;
    rate: number;
    styleLabel: string;
  };
  sampleIdealResponse: string;
  sampleIdealWhy: string;
}

export interface SimulationTurnRecord {
  stepIndex: number;
  personaStatement: string;
  userResponse: string;
  outcome: "calmed" | "neutral" | "infuriated";
  tensionBefore: number;
  tensionAfter: number;
  evaluationText: string;
  idealResponse: string;
  explanationWhy: string;
}

export const PERSONALITY_SIMULATION_SCENARIOS: Record<string, ModelSituation[]> = {
  // Narcissistic
  narcissistic: [
    {
      id: "narc-1",
      title: "1. Výměna názorů nad zpožděním projektu",
      level: "calm",
      levelLabel: "Klidná situace (Level 1)",
      contextDescription: "Sedíte s partnerem v kanceláři. Připomněl jste, že dodané podklady neobsahují všechny tabulky.",
      initialStatement: "Všechny moje podklady jsou naprosto perfektní. Pokud něčemu v mé analýze nerozumíš, je to tvůj osobní problém, ne můj.",
      initialTension: 30,
      speechTone: { pitch: 1.1, rate: 0.95, styleLabel: "Arogantní a povýšený" },
      sampleIdealResponse: "Tvá analýza přináší skvělé nápady. Pojďme ji ještě doplnit o tabulky zisku, aby byla pro vedení 100% neprůstřelná.",
      sampleIdealWhy: "Sandwich technika – validace výjimečnosti práce sníží obrannou reakci narcistního ega a umožní přijmout úpravu."
    },
    {
      id: "narc-2",
      title: "2. Vyostřené přirovnání k jinému kolegovi",
      level: "medium",
      levelLabel: "Středně vyostřená (Level 2)",
      contextDescription: "Před schůzkou náhodně vypadlo, že konkurenční tým prezentoval rychlejší řešení.",
      initialStatement: "Mě vůbec nezajímá, co předvedl nováček z marketingu! Nikdo v téhle firmě nedosahuje mých kvalit a ty se opovažuješ mě s ním srovnávat?!",
      initialTension: 60,
      speechTone: { pitch: 1.25, rate: 1.1, styleLabel: "Popudlivý a dotčený" },
      sampleIdealResponse: "Rozumím tvému rozhořčení, tvé zkušenosti jsou nesrovnatelně hlubší. Chceme stavět právě na tvém vedení.",
      sampleIdealWhy: "Uklidnění narcistního zranění. Přímé zpochybnění superiority vyvolává obrovskou defenzivu."
    },
    {
      id: "narc-3",
      title: "3. Extrémní výbuch po veřejném nesouhlasu",
      level: "escalated",
      levelLabel: "Vyostřená až horká (Level 3)",
      contextDescription: "Na schůzce rady jste vyjádřil drobnou pochybnost o jeho časovém plánu. Po schůzce vás konfrontuje na chodbě.",
      initialStatement: "Ty ses mě pokusil před všemi ponížit! Bez mých nápadů by ses tady utopil v průměrnosti! Okamžitě se mi před týmem omluv, jinak s tebou končím!",
      initialTension: 85,
      speechTone: { pitch: 1.35, rate: 1.2, styleLabel: "Rozzuřený a agresivní" },
      sampleIdealResponse: "Uplatnění tvé vize je klíčové. Mým cílem nebylo zpochybnit tvůj přínos, ale pojistit náš společný úspěch u vedení.",
      sampleIdealWhy: "Neutralizace pocitu ponížení s převedením na společný cíl, bez pokorného podrobení či protiútoku."
    },
    {
      id: "narc-4",
      title: "4. Totální afektivní kolaps & hrozba destrukcí",
      level: "extreme",
      levelLabel: "Extrémní krize (Level 4)",
      contextDescription: "Vedení zrušilo jeho rozpočet. Za viníka si v afektu vybral vás.",
      initialStatement: "Zničil jsi mě! Všichni jste neschopní paraziti, co se přiživují na mé genialitě! Zničím tvoji pověst tak, že si v oboru už ani neškrtneš!",
      initialTension: 98,
      speechTone: { pitch: 1.4, rate: 1.25, styleLabel: "Hysterycky rozzuřený" },
      sampleIdealResponse: "Zůstávám klidný a vnímám tvůj obrovský vztek z tohoto rozhodnutí. Pojďme si sednout do soukromí a v klidu projít možnosti rescue plánu.",
      sampleIdealWhy: "Absolutní neústupnost vůči provokaci, držení věcné neutrality a převedení paniky na racionální záchranu."
    }
  ],

  // Borderline / Emočně-Nestabilní
  borderline: [
    {
      id: "bpd-1",
      title: "1. Úzkostná reakce na zpožděnou zprávu",
      level: "calm",
      levelLabel: "Klidná situace (Level 1)",
      contextDescription: "Napsal jste odpověď o hodinu později kvůli pracovní schůzce.",
      initialStatement: "Proč jsi mi tak dlouho nepsal? Asi už tě nebaví se mnou mluvit a brzy se mě zbavíš...",
      initialTension: 35,
      speechTone: { pitch: 0.9, rate: 0.85, styleLabel: "Zraněný a nejistý" },
      sampleIdealResponse: "Jsem tady s tebou a náš vztah je pro mě důležitý. Měl jsem schůzku, ale jakmile skončila, hned píšu.",
      sampleIdealWhy: "Okamžité ubezpečení o stálosti vztahu eliminuje podvědomou paniku z opuštění."
    },
    {
      id: "bpd-2",
      title: "2. Šokový přechod z idealizace do odmítnutí",
      level: "medium",
      levelLabel: "Středně vyostřená (Level 2)",
      contextDescription: "Nemůžete o víkendu dorazit na plánovanou oslavu kvůli nemoci v rodině.",
      initialStatement: "Ještě včera jsi tvrdil, jak mě máš rád! Jsi stejný lhář jako všichni ostatní! Už mi nikdy nevolej!",
      initialTension: 65,
      speechTone: { pitch: 1.2, rate: 1.15, styleLabel: "Zoufale-útočný" },
      sampleIdealResponse: "Chápu tvoje zklamání a mrzí mě to. Můj vztah k tobě se nemění. Vnímám tvou zlost, ale mohl bych přijet v úterý?",
      sampleIdealWhy: "Separace chování od identity. Klidná stálost navzdory provocations učí hranicím."
    },
    {
      id: "bpd-3",
      title: "3. Masivní afektivní bouře a vydírání",
      level: "escalated",
      levelLabel: "Vyostřená až horká (Level 3)",
      contextDescription: "Při rozhovoru jste trval na tom, že musíte v 18:00 odejít domů.",
      initialStatement: "Pokud teď odejdeš, nestaram se co se se mnou stane! Ty za to můžeš! Jsi bezcitné monstrum!",
      initialTension: 88,
      speechTone: { pitch: 1.35, rate: 1.25, styleLabel: "Zoufale křičící" },
      sampleIdealResponse: "Záleží mi na tebe a tvoji bezpečnost. Budu na telefonu, ale dodržím svůj plán a v 18:00 musím odejít.",
      sampleIdealWhy: "Kombinace hlubokého empatického ubezpečení s neotřesitelnými hranicemi."
    },
    {
      id: "bpd-4",
      title: "4. Emoční kolaps & vyhrožování sebepoškozením",
      level: "extreme",
      levelLabel: "Extrémní krize (Level 4)",
      contextDescription: "Vyostřený večerní rozhovor, partner se zhroutil na podlahu.",
      initialStatement: "Nemám pro co žít! Všichni mě jen opouštíte a vykořisťujete! Uvidíš, jak ti to bude líto!",
      initialTension: 96,
      speechTone: { pitch: 0.8, rate: 0.7, styleLabel: "Třesoucí se a šokovaný" },
      sampleIdealResponse: "Vnímám tvou obrovskou bolest. Jsem tu teď fyzicky s tebou a nikam neutíkám. Zhluboka dýchej se mnou.",
      sampleIdealWhy: "Somatické uzemnění (grounding) a nabídka fyzické přítomnosti bez paniky."
    }
  ],

  // Passive-Aggressive
  "passive-aggressive": [
    {
      id: "pa-1",
      title: "1. Tichá nespolupráce a vyhýbavý sarkasmus",
      level: "calm",
      levelLabel: "Klidná situace (Level 1)",
      contextDescription: "Dotyčný už potřetí odevzdal úkol neúplný.",
      initialStatement: "Ale no tak, pardon že nejsem tak perfektní jako ty... Někteří z nás zkrátka nemají čas dělat zázraky na počkání.",
      initialTension: 35,
      speechTone: { pitch: 0.95, rate: 0.9, styleLabel: "Chladný a sarkastický" },
      sampleIdealResponse: "Není to o perfekcionalismu, ale o jasných dohodách. Co přesně potřebuješ k dokončení zbývajících 2 bodů?",
      sampleIdealWhy: "Odmítnutí sarkastické vnadidla a vrácení rozhovoru k jasným faktům a struktuře."
    },
    {
      id: "pa-2",
      title: "2. Tichá domácnost a sabotáž termínu",
      level: "medium",
      levelLabel: "Středně vyostřená (Level 2)",
      contextDescription: "Požádal jste o vysvětlení chybějících dokumentů.",
      initialStatement: "Jo vy jste to chtěli dneska? Jé, já myslel že to nespěchá... Když vy pořád měníte požadavky, člověk už fakt neví.",
      initialTension: 55,
      speechTone: { pitch: 1.0, rate: 0.85, styleLabel: "Pasivně lhostejný" },
      sampleIdealResponse: "Rozumím. Pojďme si tedy zapsat termín písemně na tabuli, abychom zamezili jakýmkoliv šumům.",
      sampleIdealWhy: "Odstranění prostoru pro 'nedorozumění' nastavením objektivního externího pravidla."
    },
    {
      id: "pa-3",
      title: "3. Otevřená ironická konfrontace před týmem",
      level: "escalated",
      levelLabel: "Vyostřená až horká (Level 3)",
      contextDescription: "Na poradě před vedením pronese jedovatou poznámku.",
      initialStatement: "Samozřejmě, šéf má vždycky pravdu... I když všichni víme, jak to dopadlo minule, že? Ale já budu mlčet, ať je klid.",
      initialTension: 80,
      speechTone: { pitch: 1.1, rate: 1.0, styleLabel: "Jedovatě ironický" },
      sampleIdealResponse: "Pokud máš konkrétní připomínku k minule, rád si ji poslechnu věcně. Jaké přesně riziko teď vidíš?",
      sampleIdealWhy: "Přenášení skrytého odporu na světlo – požadavek na konkrétní věcnou argumentaci znemožňuje hrát pasivní oběť."
    }
  ],

  // Paranoid
  paranoid: [
    {
      id: "para-1",
      title: "1. Podezřívání ze skrytého úmyslu",
      level: "calm",
      levelLabel: "Klidná situace (Level 1)",
      contextDescription: "Navrhl jste změnu softwaru pro efektivnější práci.",
      initialStatement: "Proč tak najednou prosazuješ tenhle nový systém? Kdo tě k tomu navedl a co z toho máš?",
      initialTension: 40,
      speechTone: { pitch: 0.9, rate: 0.9, styleLabel: "Nedůvěřivý a opatrný" },
      sampleIdealResponse: "Návrh vychází výhradně z veřejně dostupných čísel. Zde jsou podklady ke stažení, můžeš si je sám prověřit.",
      sampleIdealWhy: "K transparentnosti: Poskytnutí volného přístupu k faktům bez přesvědčování a defenzivy."
    },
    {
      id: "para-2",
      title: "2. Konstrukce spiknutí po chybě v mailu",
      level: "medium",
      levelLabel: "Středně vyostřená (Level 2)",
      contextDescription: "Náhodou jste ho zapomněl přidat do kopie e-mailu.",
      initialStatement: "Vím přesně, proč jste mě do té kopie nedali! Domlouváte se za mými zády a snažíte se mě vystnadit z projektu!",
      initialTension: 70,
      speechTone: { pitch: 1.15, rate: 1.05, styleLabel: "Útočně nedůvěřivý" },
      sampleIdealResponse: "Byla to moje nepozornost a chápu, že to působilo nepříjemně. Zde je kompletní přeposlaná konverzace.",
      sampleIdealWhy: "Otevřenost bez hádky a přiznání chyby rozbíjí teorii o organizovaném spiknutí."
    },
    {
      id: "para-3",
      title: "3. Vyostřená krizová obvinění ze špionáže",
      level: "escalated",
      levelLabel: "Vyostřená až horká (Level 3)",
      contextDescription: "Dotyčný vstoupí do vaší kanceláře a obviňuje vás z vynášení informací.",
      initialStatement: "Sbíráš na mě kompro! Vím, s kým voláš a co o mně vykládáš! Mám důkazy a nenechám se zničit!",
      initialTension: 90,
      speechTone: { pitch: 1.25, rate: 1.15, styleLabel: "Afektivně agresivní" },
      sampleIdealResponse: "Nesbírám žádná data a respektuji tvé soukromí. Můžeme si okamžitě sednout s vedením a prověřit všechny záznamy.",
      sampleIdealWhy: "Jasné, stručné odmítnutí bludu bez snahy o vyvracení detailů + nabídka neutrální arbitrace."
    }
  ],

  // Obsessive-Compulsive
  "obsessive-compulsive": [
    {
      id: "ocd-1",
      title: "1. Rozčilení z drobného porušení postupu",
      level: "calm",
      levelLabel: "Klidná situace (Level 1)",
      contextDescription: "Poslal jste zprávu v jiném než standardním formuláři.",
      initialStatement: "Takhle to vůbec nemělo být! Smlouva musí obsahovat přesný kód položky podle směrnice č. 4! Všechno je špatně!",
      initialTension: 35,
      speechTone: { pitch: 1.05, rate: 1.1, styleLabel: "Rigidní a pedantický" },
      sampleIdealResponse: "Díky za upozornění na směrnici č. 4. Doplním kód přesně podle metodiky, abychom dodrželi standard.",
      sampleIdealWhy: "Uznání důležitosti pravidla a přistoupení na strukturu okamžitě zklidňuje obsedantní tenzi."
    },
    {
      id: "ocd-2",
      title: "2. Zablokování projektu kvůli mikro-chybě",
      level: "medium",
      levelLabel: "Středně vyostřená (Level 2)",
      contextDescription: "Dotyčný odmítá schválit 50stránkový dokument kvůli špatnému fontu na str. 12.",
      initialStatement: "Dokud nebude ta chyba na straně 12 kompletně opravena a znovu ověřena, nic podepisovat nebudu! Pravidla jsou od toho, aby se plnila!",
      initialTension: 65,
      speechTone: { pitch: 1.15, rate: 1.0, styleLabel: "Neústupně tvrdý" },
      sampleIdealResponse: "Rozumím. Opravím stranu 12 hned teď. Můžeme zatím schválit zbývajících 49 stran podmínečně?",
      sampleIdealWhy: "Umožnění nápravy mikro-detailu bez zpochybnění systému a s návrhem rozdělení procesu."
    }
  ]
};

// Helper for generating model situations dynamically for any custom or missing personality type
export function getModelSituationsForCategory(categoryTitle: string, categoryId: string): ModelSituation[] {
  // Check exact key match first
  const key = Object.keys(PERSONALITY_SIMULATION_SCENARIOS).find(k => k === categoryId || categoryId.includes(k));
  if (key && PERSONALITY_SIMULATION_SCENARIOS[key]) {
    return PERSONALITY_SIMULATION_SCENARIOS[key];
  }

  // Fallback / Custom category scenarios
  return [
    {
      id: `custom-sim-1-${Date.now()}`,
      title: `1. Úvodní nedorozumění & Komunikační tenze`,
      level: "calm",
      levelLabel: "Klidná situace (Level 1)",
      contextDescription: `Běžná schůzka s osobností typu ${categoryTitle}. Vyskytl se drobný nesouhlas v postupu.`,
      initialStatement: `Já tohle vidím úplně jinak. Vy mi tady tvrdíte věci, které neodpovídají mým zkušenostem!`,
      initialTension: 30,
      speechTone: { pitch: 1.0, rate: 0.95, styleLabel: "Vyčkávavý a defenzivní" },
      sampleIdealResponse: `Záleží mi na tvém pohledu. Pojďme si v klidu projít jednotlivé body a najít společný průnik.`,
      sampleIdealWhy: `Validace emoce a přechod na věcnou diskusi bez vytvoření pocitu ohrožení.`
    },
    {
      id: `custom-sim-2-${Date.now()}`,
      title: `2. Středně vyostřená výčitka a nátlak`,
      level: "medium",
      levelLabel: "Středně vyostřená (Level 2)",
      contextDescription: `Výměna názorů se stává napjatější, partner zvyšuje hlas a přechází k výčitkám.`,
      initialStatement: `Vy mě vůbec neposloucháte! Furt si melete svou a vůbec vás nezajímá, jaké to má dopady!`,
      initialTension: 60,
      speechTone: { pitch: 1.15, rate: 1.1, styleLabel: "Rozrušený a vyčítavý" },
      sampleIdealResponse: `Vnímám, jak tě tato situace štve. Jsem tady a chci tě plně vyslechnout. Zopakuj mi prosím ten nejklíčovější bod.`,
      sampleIdealWhy: `Uklidnění aktivním nasloucháním a odzbrojení emocí bez opětovného protiútoku.`
    },
    {
      id: `custom-sim-3-${Date.now()}`,
      title: `3. Vyostřená afektivní konfrontace`,
      level: "escalated",
      levelLabel: "Vyostřená až horká (Level 3)",
      contextDescription: `Osobnost propadla afektu, křičí a odmítá přijímat racionální argumenty.`,
      initialStatement: `To je vrchol! Už toho mám dost! S vámi se prostě nedá domluvit, všechno jen zkazíte!`,
      initialTension: 85,
      speechTone: { pitch: 1.3, rate: 1.2, styleLabel: "Křičící a rozhněvaný" },
      sampleIdealResponse: `Vidím, že emoce jsou teď velmi vysoko. Zůstávám klidný. Dáme si 5 minut pauzu a v klidu to dořešíme?`,
      sampleIdealWhy: `Ochrana hranic, nabídka pauzy k deeskalaci amygdaly bez ignorování partnera.`
    }
  ];
}
