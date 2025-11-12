

import { GoogleGenAI, Type } from "@google/genai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Skema definitioner for at sikre struktureret output fra AI'en
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


const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { type, payload } = body;
        
        const ai = new GoogleGenAI({ apiKey });
        const model = "gemini-2.5-flash";

        let response;
        let jsonText;

        switch (type) {
            case 'isbar': {
                const { scenario, reportText } = payload;
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
                response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: isbarFeedbackSchema,
                    },
                });
                jsonText = response.text.trim();
                break;
            }
            case 'closedLoop': {
                const { scenario, history } = payload;
                const formattedHistory = history
                    .map((msg: { role: string; text: string }) => `${msg.role === 'user' ? 'Bruger' : 'Læge'}: ${msg.text}`)
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
                response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: closedLoopFeedbackSchema,
                    },
                });
                jsonText = response.text.trim();
                break;
            }
            case 'quiz': {
                const { numberOfQuestions } = payload;
                const prompt = `
                    Du er en klinisk underviser med speciale i sygepleje i Danmark. Din opgave er at generere et quiz-sæt med ${numberOfQuestions} spørgsmål om akut kommunikation for sygeplejersker (f.eks. ISBAR, closed loop, kommunikation med patienter/pårørende).
                    
                    Spørgsmålene skal være relevante for dansk sundhedsvæsen.
                    Varier mellem 'multiple-choice' (hvor kun ét svar er korrekt) og 'multiple-select' (hvor flere svar kan være korrekte).
                    Sørg for, at 'options'-listen indeholder både de korrekte og plausible forkerte svar.
                    
                    Returnér quizzen som et JSON-array, der følger det specificerede skema. Sørg for at 'correctAnswers' er et array, selv for 'multiple-choice' spørgsmål (med kun ét element).
                `;
                response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: quizQuestionSchema,
                    },
                });
                jsonText = response.text.trim();
                break;
            }
            case 'chat': {
                const { history, systemInstruction } = payload;

                const contents = history.map((msg: { role: string; text: string; }) => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }));

                response = await ai.models.generateContent({
                    model,
                    contents,
                    config: {
                        systemInstruction: systemInstruction
                    },
                });
                const responseText = response.text;
                jsonText = JSON.stringify({ text: responseText });
                break;
            }
            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request type' }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonText,
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred while processing the request.' }),
        };
    }
};

export { handler };