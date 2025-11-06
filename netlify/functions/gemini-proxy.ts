
import { GoogleGenAI, Type } from "@google/genai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Skema definitioner skal matche dem i frontend/services/geminiService.ts
const isbarFeedbackSchema = {
    type: Type.OBJECT,
    properties: {
        opening: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    rating: { type: Type.STRING, enum: ['God', 'Tilstrækkelig', 'Kræver forbedring'] },
                    points: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'rating', 'points']
            }
        },
        conclusion: { type: Type.STRING }
    },
    required: ['opening', 'sections', 'conclusion']
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

        if (type === 'isbar') {
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
            
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: isbarFeedbackSchema,
                },
            });

            const jsonText = response.text.trim();
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: jsonText,
            };
        }

        // Her kan du tilføje logik for 'closedLoop' og 'quiz' i fremtiden

        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request type' }) };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred while processing the request.' }),
        };
    }
};

export { handler };
