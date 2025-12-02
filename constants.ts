
import { ScenarioData, IsbarInput } from './types';

export const SCENARIO: ScenarioData = {
  title: "Case: Hr. Svendsen",
  description: `Hr. Svendsen er i går blevet indlagt på FAM stue 22 med KOL i exacerbation og har ved indlæggelsen fået konstateret en pneumoni. Han er opstartet i iv antibiotikabehandling med iv. Tazocin 4 g. x 3. og der er opstartet iltbehandling med 2 l/min på iltbrille. Patienten tager sin vanlige inhalationsmedicin.

Du tilser i AV Hr. Svendsen, da han i løbet af de sidste timer er blevet tiltagende dårlig. Da du kommer ind til han, spørger du til, hvordan det går, hvortil han meget kortåndet svarer, at det er svært at få luft. Du observerer at han bruger lang tid på ekspirationerne og at hans vejrtrækning er rallende. Du lejrer han siddende i sengen og måler hans respirationsfrekvens til 32 og hans SAT til 86. Herefter øger du ilten til 3 l/min og får en kollega til at tage en A-gas og måle yderligere værdier, mens du fokuserer på patienten der virker bange og urolig. Din kollega måler en puls på 110 og et BT på 167/82.

Temperaturen er i starten af vagten, for 1 time siden, målt til 37,1. Patienten bliver tiltagende urolig og han virker afkræftet. Du tager hans hånd for at berolige ham - huden føles varm og tør. Sammen med din kollega bliver I enige om at kontakte lægen, da hans SAT fortsætter med at ligge på 86-88%.`,
};

export const EXEMPLARY_ISBAR: IsbarInput = {
  identification: "Jeg hedder [Dit Navn], sygeplejerske fra FAM. Jeg ringer angående Hr. Svendsen på stue 22 (CPR: xxxxx-xxxx).",
  situation: "Patienten er blevet tiltagende respiratorisk dårlig med dyspnø og lav saturation på 86-88% trods iltøgning.",
  background: "Han blev indlagt i går med KOL i exacerbation og pneumoni. Han er i behandling med IV Tazocin og vanlig inhalation. Han fik oprindeligt 2 L ilt, nu øget til 3 L.",
  analysis: "Han er klamtsvedende, urolig og rallende. RF er 32, Puls 110, BT 167/82. Han virker udtrættet og septisk eller med forværring af sin pneumoni/KOL. A-gas er bestilt men svar foreligger ikke endnu.",
  recommendation: "Jeg har brug for, at du kommer og tilser ham nu. Skal jeg øge ilten yderligere eller give mere inhalationsmedicin indtil du kommer?"
};

export const ISBAR_CHECKLIST = [
  "Har du præsenteret dig selv og patienten tydeligt (Navn, CPR, Afdeling)?",
  "Har du beskrevet det akutte problem først (Situation)?",
  "Er relevante målinger (RF, SAT, BT, Puls) inkluderet?",
  "Har du nævnt den aktuelle behandling (Medicin, Ilt)?",
  "Har du givet en tydelig anbefaling eller stillet et konkret spørgsmål til lægen?"
];
