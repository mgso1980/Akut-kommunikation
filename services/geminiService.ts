
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Message, StructuredFeedback, QuizQuestion } from '../types';

// --- MOCK DATA FOR DEMO MODE ---
const MOCK_ISBAR_FEEDBACK: StructuredFeedback = {
    opening: "OBS: Dette er et demo-svar (Ingen API-nøgle fundet). Her ville AI'en normalt give specifik ros baseret på din tekst.",
    sections: [
        {
            title: "Identifikation",
            rating: "God",
            points: ["Du præsenterede dig korrekt med navn og afdeling.", "Patientens data blev nævnt tydeligt."]
        },
        {
            title: "Situation",
            rating: "Tilstrækkelig",
            points: ["Du beskrev det akutte problem.", "Husk at være endnu mere præcis med tidslinjen."]
        },
        {
            title: "Baggrund & Analyse",
            rating: "God",
            points: ["Relevante vitale værdier blev videregivet.", "God sammenkobling af symptomer."]
        }
    ],
    conclusion: "Dette er en standard konklusion for demo-tilstand. Med en gyldig API-nøgle vil du her få en personlig opsummering."
};

const MOCK_CLOSED_LOOP_FEEDBACK: StructuredFeedback = {
    opening: "Demo-feedback: Closed Loop simulation gennemført.",
    sections: [
        {
            title: "Afklaring af Uklarheder",
            rating: "God",
            points: ["Du spurgte ind til dosis, hvilket var korrekt.", "Godt at du fik præciseret administrationsvejen."]
        },
        {
            title: "Korrekt 'Closed Loop'",
            rating: "Tilstrækkelig",
            points: ["Du gentog ordinationerne, men glemte en enkelt detalje undervejs.", "Husk altid at gentage medicinnavnet fuldt ud."]
        }
    ],
    conclusion: "Flot arbejde. I denne demo-version analyseres dine specifikke svar ikke dybdegående."
};

const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 1,
        type: 'multiple-choice',
        question: "(Demo) Hvad står 'I' for i ISBAR?",
        options: ["Information", "Identifikation", "Indlæggelse", "Intervention"],
        correctAnswers: ["Identifikation"]
    },
    {
        id: 2,
        type: 'multiple-choice',
        question: "(Demo) Hvorfor bruger vi Closed Loop kommunikation?",
        options: ["For at spare tid", "For at sikre at beskeden er forstået korrekt", "For at teste lægens viden", "Det er kun for piloter"],
        correctAnswers: ["For at sikre at beskeden er forstået korrekt"]
    },
    {
        id: 3,
        type: 'multiple-select',
        question: "(Demo) Hvilke vitale værdier er relevante ved dyspnø?",
        options: ["Saturation (SAT)", "Respirationsfrekvens", "Blodsukker", "Hårfarve"],
        correctAnswers: ["Saturation (SAT)", "Respirationsfrekvens"]
    }
];

// --- REAL AI SERVICE ---

const getAiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("ADVARSEL: API_KEY mangler. Applikationen kører i DEMO-tilstand.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const modelId = "gemini-2.5-flash";

// Schemas
const isbarFeedbackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        opening: { type: Type.STRING, description: "En kort, opmuntrende åbningserklæring." },
        sections: {
            type: Type.ARRAY,
            description: "En liste af feedback-sektioner for hver del af ISBAR.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Titlen på sektionen (f.eks. 'Identifikation', 'Situation')." },
                    rating: { 
                        type: Type.STRING, 
                        description: "En vurdering af sektionen.",
                        enum: ['God', 'Tilstrækkelig', 'Kræver forbedring'],
                    },
                    points: {
                        type: Type.ARRAY,
                        description: "En liste af specifikke feedbackpunkter som strenge.",
                        items: { type: Type.STRING }
                    }
                },
                required: ['title', 'rating', 'points']
            }
        },
        conclusion: { type: Type.STRING, description: "En opsummerende konklusion med de vigtigste læringspunkter." }
    },
    required: ['opening', 'sections', 'conclusion']
};

const closedLoopFeedbackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        opening: { type: Type.STRING, description: "En kort, opmuntrende åbningserklæring." },
        sections: {
            type: Type.ARRAY,
            description: "En liste af feedback-sektioner baseret på evalueringskriterierne.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { 
                        type: Type.STRING, 
                        description: "Titlen på sektionen (f.eks. 'Afklaring af Uklarheder', 'Korrekt \"Closed Loop\" Bekræftelse')." 
                    },
                    rating: { 
                        type: Type.STRING, 
                        description: "En vurdering af præstationen i denne sektion.",
                        enum: ['God', 'Tilstrækkelig', 'Kræver forbedring'],
                    },
                    points: {
                        type: Type.ARRAY,
                        description: "En liste af specifikke feedbackpunkter med eksempler fra samtalen.",
                        items: { type: Type.STRING }
                    }
                },
                required: ['title', 'rating', 'points']
            }
        },
        conclusion: { type: Type.STRING, description: "En opsummerende konklusion med de vigtigste læringspunkter og anbefalinger." }
    },
    required: ['opening', 'sections', 'conclusion']
};

const quizQuestionSchema: Schema = {
    type: Type.ARRAY,
    description: "En liste af quiz-spørgsmål.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.INTEGER, description: "Et unikt ID for spørgsmålet (f.eks. 1, 2, 3)." },
            type: {
                type: Type.STRING,
                description: "Typen af spørgsmål.",
                enum: ['multiple-choice', 'multiple-select']
            },
            question: { type: Type.STRING, description: "Selve spørgsmålsteksten." },
            options: {
                type: Type.ARRAY,
                description: "En liste af svarmuligheder (typisk 4-5).",
                items: { type: Type.STRING }
            },
            correctAnswers: {
                type: Type.ARRAY,
                description: "En liste med de korrekte svar. For 'multiple-choice' skal denne liste kun indeholde ét svar.",
                items: { type: Type.STRING }
            }
        },
        required: ['id', 'type', 'question', 'options', 'correctAnswers']
    }
};

// API Functions

export async function getIsbarFeedback(scenario: string, reportText: string): Promise<StructuredFeedback> {
    const ai = getAiClient();
    if (!ai) {
        // Fallback to mock data if no API key
        return new Promise(resolve => setTimeout(() => resolve(MOCK_ISBAR_FEEDBACK), 1000));
    }

    const prompt = `
        Du er Dr. Erik Jørgensen, en erfaren og pædagogisk anlagt overlæge. Analysér den skriftlige ISBAR-rapport nedenfor. 
        Dit mål er at vejlede og styrke brugerens kompetencer. Din feedback skal være konstruktiv, støttende og fremhæve både styrker og områder til forbedring i en positiv og motiverende tone.
        **Vigtigt vedr. tilgængelighed: Vær tolerant over for stavefejl. Hvis et ord er stavet forkert, men den kliniske mening er klar (f.eks. "pnumoni" i stedet for "pneumoni"), skal du vurdere indholdet og ikke kommentere på stavningen, medmindre det skaber alvorlig tvetydighed.**
        Returnér din feedback som et JSON-objekt, der følger det specificerede skema.

        **Vigtigt: Basér udelukkende din feedback på informationen i det givne 'Klinisk Scenarie'. Antag ikke, at brugeren har adgang til information, der ikke er eksplicit nævnt (f.eks. A-gas resultater, som kun er bestilt, ikke modtaget).**

        **Vurderingskriterier:**
        - **Struktur:** Er rapporten logisk opbygget efter ISBAR?
        - **Indhold:** Er alle relevante informationer fra scenariet med i hver sektion? Er informationen præcis?
        - **Klarhed:** Er rapporten koncis og let at forstå?

        **Klinisk Scenarie:**
        ${scenario}

        ---

        **Brugerens skriftlige ISBAR-rapport:**
        "${reportText}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: isbarFeedbackSchema,
            },
        });
        
        const text = response.text;
        if (!text) throw new Error("Intet svar modtaget fra AI.");
        return JSON.parse(text) as StructuredFeedback;
    } catch (error) {
        console.error("Fejl ved ISBAR feedback (Fallback til demo):", error);
        return MOCK_ISBAR_FEEDBACK;
    }
}

export async function getClosedLoopFeedback(scenario: string, history: Message[]): Promise<StructuredFeedback> {
    const ai = getAiClient();
    if (!ai) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_CLOSED_LOOP_FEEDBACK), 1000));
    }
    
    // Format history for the prompt (as a transcript)
    const formattedHistory = history
        .map(msg => `${msg.role === 'user' ? 'Bruger' : 'Læge'}: ${msg.text}`)
        .join('\n');

    const prompt = `
        Du er Dr. Erik Jørgensen, en erfaren overlæge. Evaluér den transskriberede "Closed Loop"-samtale nedenfor.
        Din feedback skal være direkte og ærlig. **Påpeg tydeligt, når brugeren misser en upræcis ordination eller fejler i at gentage den korrekt.** Forklar de potentielle kliniske risici.
        **Vigtigt vedr. tilgængelighed: Vær tolerant over for stavefejl i brugerens svar. Fokuser på, om den kliniske intention er forstået, ikke på præcis stavning.**
        Returnér din feedback som et JSON-objekt, der følger det specificerede skema.

        **Evalueringskriterier (brug disse som titler i dine sektioner):**
        1.  **Afklaring af Uklarheder:** Vurder, om brugeren identificerede og afklarede de bevidst upræcise ordinationer.
        2.  **Korrekt "Closed Loop" Bekræftelse:** Vurder, om brugeren gentog den *fulde og korrekte* ordination tilbage.
        3.  **Initiativ og Kommunikation:** Vurder, om brugeren tog styring i kommunikationen.

        **Klinisk Scenarie:**
        ${scenario}

        ---

        **Transskription af Samtalen:**
        ${formattedHistory}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: closedLoopFeedbackSchema,
            },
        });
        
        const text = response.text;
        if (!text) throw new Error("Intet svar modtaget fra AI.");
        return JSON.parse(text) as StructuredFeedback;
    } catch (error) {
        console.error("Fejl ved Closed Loop feedback (Fallback til demo):", error);
        return MOCK_CLOSED_LOOP_FEEDBACK;
    }
}

export async function getChatResponse(history: Message[], systemInstruction: string): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
         // Simple mock logic for chat
         const lastMsg = history[history.length - 1]?.text.toLowerCase() || "";
         let reply = "Jeg hører hvad du siger. (DEMO: AI-nøgle mangler)";
         
         if (lastMsg.includes("ilt")) reply = "Fint. Hvad så med EKG? (DEMO)";
         else if (lastMsg.includes("ekg")) reply = "Modtaget. Ring når du har svar. (DEMO)";
         else reply = "Jeg afventer dit opkald. (DEMO)";

         return new Promise(resolve => setTimeout(() => resolve(reply), 500));
    }
    
    // Convert history to Content objects
    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const text = response.text;
        if (!text) throw new Error("Intet svar modtaget fra AI.");
        return text;
    } catch (error) {
        console.error("Fejl ved chat svar:", error);
        throw error;
    }
}

export async function generateQuizQuestions(numberOfQuestions: number = 8): Promise<QuizQuestion[]> {
    const ai = getAiClient();
    if (!ai) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_QUIZ_QUESTIONS), 1000));
    }

    const prompt = `
        Du er en klinisk underviser med speciale i sygepleje i Danmark. Din opgave er at generere et quiz-sæt med ${numberOfQuestions} spørgsmål om akut kommunikation for sygeplejersker (f.eks. ISBAR, closed loop, kommunikation med patienter/pårørende).
        
        Spørgsmålene skal være relevante for dansk sundhedsvæsen.
        Varier mellem 'multiple-choice' (hvor kun ét svar er korrekt) og 'multiple-select' (hvor flere svar kan være korrekte).
        Sørg for, at 'options'-listen indeholder både de korrekte og plausible forkerte svar.
        
        Returnér quizzen som et JSON-array, der følger det specificerede skema. Sørg for at 'correctAnswers' er et array, selv for 'multiple-choice' spørgsmål (med kun ét element).
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizQuestionSchema,
            },
        });
        
        const text = response.text;
        if (!text) throw new Error("Intet svar modtaget fra AI.");
        return JSON.parse(text) as QuizQuestion[];
    } catch (error) {
        console.error("Fejl ved generering af quiz (Fallback til demo):", error);
        return MOCK_QUIZ_QUESTIONS;
    }
}
