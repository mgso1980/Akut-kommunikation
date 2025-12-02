import { GoogleGenAI, Type } from "@google/genai";
import { Message, StructuredFeedback, QuizQuestion } from '../types';

// Initialize AI client with validation
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("CRITICAL ERROR: process.env.API_KEY is missing or empty.");
    throw new Error("API_KEY mangler! Tjek at 'process.env.API_KEY' er konfigureret korrekt i miljøvariablerne.");
  }
  return new GoogleGenAI({ apiKey });
};

const modelName = "gemini-2.5-flash";

const isbarFeedbackSchema = {
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

const closedLoopFeedbackSchema = {
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
        conclusion: { type: Type.STRING, description: "En opsummerende konklusion med de vigtigste læringspunktioner og anbefalinger." }
    },
    required: ['opening', 'sections', 'conclusion']
};

const quizQuestionSchema = {
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

export async function getIsbarFeedback(scenario: string, reportText: string): Promise<StructuredFeedback> {
  try {
    const ai = getAiClient();
    const prompt = `
        Du er Dr. Erik Jørgensen, en erfaren og pædagogisk anlagt overlæge. Analysér den skriftlige ISBAR-rapport nedenfor. 
        Dit mål er at vejlede og styrke brugerens kompetencer. Din feedback skal være konstruktiv, støttende og fremhæve både styrker og områder til forbedring i en positiv og motiverende tone.
        **Vigtigt vedr. tilgængelighed: Vær tolerant over for stavefejl. Hvis et ord er stavet forkert, men den kliniske mening er klar (f.eks. "pnumoni" i stedet for "pneumoni"), skal du vurdere indholdet og ikke kommentere på stavningen, medmindre det skaber alvorlig tvetydighed.**
        
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

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: isbarFeedbackSchema,
        },
    });

    if (!response.text) throw new Error("Modtog intet tekstsvar fra AI-agenten.");
    
    try {
        return JSON.parse(response.text) as StructuredFeedback;
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw text:", response.text);
        throw new Error("Kunne ikke forstå svaret fra AI-agenten (JSON-fejl).");
    }

  } catch (error) {
    console.error("Error calling AI for ISBAR feedback:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Fejl ved hentning af feedback: ${msg}`);
  }
}

export async function getClosedLoopFeedback(scenario: string, history: Message[]): Promise<StructuredFeedback> {
  try {
    const ai = getAiClient();
    const formattedHistory = history
        .map((msg) => `${msg.role === 'user' ? 'Bruger' : 'Læge'}: ${msg.text}`)
        .join('\n');

    const prompt = `
        Du er Dr. Erik Jørgensen, en erfaren overlæge. Evaluér den transskriberede "Closed Loop"-samtale nedenfor.
        Din feedback skal være direkte og ærlig. **Påpeg tydeligt, når brugeren misser en upræcis ordination eller fejler i at gentage den korrekt.** Forklar de potentielle kliniske risici.
        **Vigtigt vedr. tilgængelighed: Vær tolerant over for stavefejl i brugerens svar. Fokuser på, om den kliniske intention er forstået, ikke på præcis stavning.**

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

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: closedLoopFeedbackSchema,
        },
    });

    if (!response.text) throw new Error("Modtog intet tekstsvar fra AI-agenten.");
    return JSON.parse(response.text) as StructuredFeedback;

  } catch (error) {
    console.error("Error calling AI for Closed Loop feedback:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Fejl ved hentning af feedback: ${msg}`);
  }
}

export async function getChatResponse(history: Message[], systemInstruction: string): Promise<string> {
  try {
    const ai = getAiClient();
    const contents = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
            systemInstruction: systemInstruction
        },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error calling AI for Chat response:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Kunne ikke få svar fra AI-agenten: ${msg}`);
  }
}

export async function generateQuizQuestions(numberOfQuestions: number = 8): Promise<QuizQuestion[]> {
  try {
    const ai = getAiClient();
    const prompt = `
        Du er en klinisk underviser med speciale i sygepleje i Danmark. Din opgave er at generere et quiz-sæt med ${numberOfQuestions} spørgsmål om akut kommunikation for sygeplejersker (f.eks. ISBAR, closed loop, kommunikation med patienter/pårørende).
        
        Spørgsmålene skal være relevante for dansk sundhedsvæsen.
        Varier mellem 'multiple-choice' (hvor kun ét svar er korrekt) og 'multiple-select' (hvor flere svar kan være korrekte).
        Sørg for, at 'options'-listen indeholder både de korrekte og plausible forkerte svar.
        
        Returnér quizzen som et JSON-array.
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: quizQuestionSchema,
        },
    });

    if (!response.text) throw new Error("Modtog intet tekstsvar fra AI-agenten.");
    return JSON.parse(response.text) as QuizQuestion[];
  } catch (error) {
    console.error("Error calling AI for Quiz questions:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Kunne ikke generere quiz: ${msg}`);
  }
}