
import { GoogleGenAI, Type } from "@google/genai";
import { Message, StructuredFeedback, QuizQuestion } from '../types';

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
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'isbar',
        payload: { scenario, reportText }
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Serverfejl: ${response.status}`);
    }

    const data = await response.json();
    return data as StructuredFeedback;
  } catch (error) {
    console.error("Error calling proxy for ISBAR feedback:", error);
    throw new Error("Kunne ikke hente feedback fra AI-agenten. Tjek konsollen for detaljer.");
  }
}

export async function getClosedLoopFeedback(scenario: string, history: Message[]): Promise<StructuredFeedback> {
  // TODO: Refactor to use Netlify Function proxy like getIsbarFeedback
  const model = "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: closedLoopFeedbackSchema,
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as StructuredFeedback;
  } catch (error) {
    console.error("Error getting closed loop feedback:", error);
    if (error instanceof SyntaxError) {
         console.error("Failed to parse JSON response from Gemini for closed loop feedback.");
         throw new Error("AI-agenten returnerede et uventet format. Prøv venligst igen.");
    }
    throw new Error("Kunne ikke generere feedback for samtalen.");
  }
}

export async function generateQuizQuestions(numberOfQuestions: number = 8): Promise<QuizQuestion[]> {
  // TODO: Refactor to use Netlify Function proxy like getIsbarFeedback
  const model = "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const prompt = `
    Du er en klinisk underviser med speciale i sygepleje i Danmark. Din opgave er at generere et quiz-sæt med ${numberOfQuestions} spørgsmål om akut kommunikation for sygeplejersker (f.eks. ISBAR, closed loop, kommunikation med patienter/pårørende).
    
    Spørgsmålene skal være relevante for dansk sundhedsvæsen.
    Varier mellem 'multiple-choice' (hvor kun ét svar er korrekt) og 'multiple-select' (hvor flere svar kan være korrekte).
    Sørg for, at 'options'-listen indeholder både de korrekte og plausible forkerte svar.
    
    Returnér quizzen som et JSON-array, der følger det specificerede skema. Sørg for at 'correctAnswers' er et array, selv for 'multiple-choice' spørgsmål (med kun ét element).
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizQuestionSchema,
      },
    });
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
        throw new Error("AI returned data in an unexpected format.");
    }
    return parsed as QuizQuestion[];
  } catch (error) {
    console.error("Error calling Gemini API for quiz questions:", error);
     if (error instanceof SyntaxError) {
         console.error("Failed to parse JSON response from Gemini for quiz.");
         throw new Error("AI-agenten returnerede et uventet format. Prøv venligst igen.");
    }
    throw new Error("Kunne ikke generere quiz-spørgsmål fra AI-agenten.");
  }
}
