
import { ScenarioData, IsbarInput, QuizQuestion } from './types';

export const SCENARIO: ScenarioData = {
  title: "Case: Hr. Svendsen",
  description: `Hr. Svendsen er i går blevet indlagt på FAM stue 22 med KOL i exacerbation og har ved indlæggelsen fået konstateret en pneumoni. Han er opstartet i iv antibiotikabehandling med iv. Tazocin 4 g. x 3. og der er opstartet iltbehandling med 2 l/min på iltbrille. Patienten tager sin vanlige inhalationsmedicin.

Du tilser i AV Hr. Svendsen, da han i løbet af de sidste timer er blevet tiltagende dårlig. Da du kommer ind til han, spørger du til, hvordan det går, hvortil han meget kortåndet svarer, at det er svært at få luft. Du observerer at han bruger lang tid på ekspirationerne og at hans vejrtrækning er rallende. Du lejrer han siddende i sengen og måler hans respirationsfrekvens til 32 og hans SAT til 86. Herefter øger du ilten til 3 l/min og får en kollega til at tage en A-gas og måle yderligere værdier, mens du fokuserer på patienten der virker bange og urolig. Din kollega måler en puls på 110 og et BT på 167/82.

Temperaturen er i starten af vagten, for 1 time siden, målt til 37,1. Patienten bliver tiltagende urolig og han virker afkræftet. Du tager hans hånd for at berolige ham - huden føles varm og tør. Sammen med din kollega bliver I enige om at kontakte lægen, da hans SAT fortsætter med at ligge på 86-88%.`,
};

export const EXEMPLARY_ISBAR: IsbarInput = {
  identifikation: "Jeg hedder [Dit Navn], sygeplejerske fra FAM. Jeg ringer angående Hr. Svendsen på stue 22 (CPR: xxxxx-xxxx).",
  situation: "Patienten er blevet tiltagende respiratorisk dårlig med dyspnø og lav saturation på 86-88% trods iltøgning.",
  baggrund: "Han blev indlagt i går med KOL i exacerbation og pneumoni. Han er i behandling med IV Tazocin og vanlig inhalation. Han fik oprindeligt 2 L ilt, nu øget til 3 L.",
  analyse: "Han er klamtsvedende, urolig og rallende. RF er 32, Puls 110, BT 167/82. Han virker udtrættet og septisk eller med forværring af sin pneumoni/KOL. A-gas er bestilt men svar foreligger ikke endnu.",
  anbefaling: "Jeg har brug for, at du kommer og tilser ham nu. Skal jeg øge ilten yderligere eller give mere inhalationsmedicin indtil du kommer?"
};

export const ISBAR_CHECKLIST = [
  "Har du præsenteret dig selv og patienten tydeligt (Navn, CPR, Afdeling)?",
  "Har du beskrevet det akutte problem først (Situation)?",
  "Er relevante målinger (RF, SAT, BT, Puls) inkluderet?",
  "Har du nævnt den aktuelle behandling (Medicin, Ilt)?",
  "Har du givet en tydelig anbefaling eller stillet et konkret spørgsmål til lægen?"
];

// --- SAFETY GUARD GAME DATA ---

export type ActionType = 'execute' | 'clarify' | 'stop';

export interface GameLevel {
  id: number;
  doctorText: string;
  correctAction: ActionType;
  successFeedback: string;
  failureFeedback: string;
}

export const SAFETY_GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    doctorText: "Han ser skidt ud. Giv ham noget ilt med det samme.",
    correctAction: 'clarify',
    successFeedback: "Korrekt! Ordren var for upræcis. Ved at spørge 'Hvor meget og på hvilket device?' sikrer du patienten mod CO2-narkose eller hypoxi.",
    failureFeedback: "Risikabelt! Du ved ikke hvor meget ilt eller hvilket device. 'Noget ilt' er ikke en gyldig ordination."
  },
  {
    id: 2,
    doctorText: "Okay. Giv 10 liter ilt på maske.",
    correctAction: 'execute',
    successFeedback: "Flot! Ordren er nu klar og tydelig (Mængde + Device). Du gentager ordinationen (Closed Loop) og udfører den.",
    failureFeedback: "Hvorfor vente? Ordinationen er nu specifik og sikker at udføre i denne akutte fase."
  },
  {
    id: 3,
    doctorText: "Han har ondt. Giv ham 2 tabletter Nitroglycerin.",
    correctAction: 'stop',
    successFeedback: "Godt fanget! Tabletter virker for langsomt akut, og han har svært ved at trække vejret. Spray/Pust er standarden akut.",
    failureFeedback: "Pas på. Tabletter er svære at synke for en dyspnøisk patient og virker langsommere. Du burde have foreslået spray/pust."
  },
  {
    id: 4,
    doctorText: "Du har ret. Giv 2 pust Nitroglycerin under tungen.",
    correctAction: 'execute',
    successFeedback: "Korrekt. Klar besked, korrekt administrationsvej og dosis. Du udfører og bekræfter.",
    failureFeedback: "Ordren er sikker og relevant for brystsmerter. Den bør udføres."
  },
  {
    id: 5,
    doctorText: "Han virker dehydreret. Sæt noget væske op.",
    correctAction: 'clarify',
    successFeedback: "Præcis! 'Noget væske' er farligt. Er det NaCl? Glukose? Og hvor hurtigt? En KOL-patient kan få lungeødem ved for meget væske.",
    failureFeedback: "Farligt! Du risikerer at overloade patientens lunger, hvis du selv gætter mængden. Du SKAL kende type og indløbstid."
  },
  {
    id: 6,
    doctorText: "Giv 1 liter NaCl. Det skal løbe ind over 30 minutter.",
    correctAction: 'execute',
    successFeedback: "Godt arbejde. Ordinationen er komplet (Væske, Mængde, Tid). Closed Loop er sluttet.",
    failureFeedback: "Ordren er komplet og specifik. Der er ingen grund til at tøve her."
  }
];

// --- QUIZ DATA ---

export const QUIZ_POOL: QuizQuestion[] = [
  {
    id: 1,
    type: 'multiple-choice',
    question: "Hvad står 'S' for i ISBAR?",
    options: ["Subjektivt", "Situation", "Sammenfatning", "Status"],
    correctAnswers: ["Situation"]
  },
  {
    id: 2,
    type: 'multiple-choice',
    question: "Hvorfor er Closed Loop kommunikation vigtigt i akutte situationer?",
    options: ["Det sparer tid i dokumentationen", "Det sikrer at beskeden er hørt og forstået korrekt", "Det er et lovkrav i alle situationer", "Det gør at lægen bestemmer mindre"],
    correctAnswers: ["Det sikrer at beskeden er hørt og forstået korrekt"]
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: "Hvilken information hører til under 'Baggrund' (B) i ISBAR?",
    options: ["Dine egne forslag til behandling", "Patientens vitale værdier lige nu", "Relevante diagnoser og indlæggelsesårsag", "Dit navn og afdeling"],
    correctAnswers: ["Relevante diagnoser og indlæggelsesårsag"]
  },
  {
    id: 4,
    type: 'multiple-select',
    question: "Hvilke vitale værdier er bekymrende hos Hr. Svendsen i casen? (Vælg alle relevante)",
    options: ["SAT 86%", "Temperatur 37,1", "Respirationsfrekvens 32", "BT 167/82"],
    correctAnswers: ["SAT 86%", "Respirationsfrekvens 32"]
  },
  {
    id: 5,
    type: 'multiple-choice',
    question: "Hvis en læge giver en ordination, som du ikke hører tydeligt, hvad skal du så gøre?",
    options: ["Gætte på det mest sandsynlige", "Udføre det du hørte og håbe det er rigtigt", "Spørge igen indtil du er sikker (Afklare)", "Vente og se om patienten får det bedre"],
    correctAnswers: ["Spørge igen indtil du er sikker (Afklare)"]
  },
  {
    id: 6,
    type: 'multiple-choice',
    question: "Hvad er det primære formål med ISBAR?",
    options: ["At strukturere overlevering af information for at øge patientsikkerheden", "At teste sygeplejerskens viden", "At gøre journalføring nemmere", "At sikre at lægen kommer hurtigere"],
    correctAnswers: ["At strukturere overlevering af information for at øge patientsikkerheden"]
  },
  {
    id: 7,
    type: 'multiple-choice',
    question: "Hvornår afsluttes 'Loopet' i Closed Loop kommunikation?",
    options: ["Når modtageren har hørt beskeden", "Når afsenderen bekræfter, at modtagerens gentagelse er korrekt", "Når handlingen er udført", "Når patienten er udskrevet"],
    correctAnswers: ["Når afsenderen bekræfter, at modtagerens gentagelse er korrekt"]
  },
  {
    id: 8,
    type: 'multiple-select',
    question: "Hvilke handlinger er en del af 'ABCDE' tilgangen? (Vælg alle relevante)",
    options: ["Airway (Luftveje)", "Breathing (Vejrtrækning)", "Dinner (Aftensmad)", "Circulation (Cirkulation)"],
    correctAnswers: ["Airway (Luftveje)", "Breathing (Vejrtrækning)", "Circulation (Cirkulation)"]
  }
];
