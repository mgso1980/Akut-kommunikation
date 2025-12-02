import { Message, StructuredFeedback, QuizQuestion } from '../types';

const PROXY_ENDPOINT = '/.netlify/functions/gemini-proxy';

async function callProxy<T>(type: string, payload: any): Promise<T> {
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
        let errorMessage = `Fejl (${response.status})`;
        try {
            const errorBody = await response.json();
            if (errorBody.error) errorMessage += `: ${errorBody.error}`;
        } catch (e) {
            // Fallback if error body isn't JSON
            const text = await response.text();
            if (text) errorMessage += `: ${text}`;
        }
        throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling AI proxy for ${type}:`, error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Kunne ikke hente svar fra AI-agenten. Tjek din internetforbindelse eller prøv igen senere. (${msg})`);
  }
}

export async function getIsbarFeedback(scenario: string, reportText: string): Promise<StructuredFeedback> {
  return callProxy<StructuredFeedback>('isbar', { scenario, reportText });
}

export async function getClosedLoopFeedback(scenario: string, history: Message[]): Promise<StructuredFeedback> {
  return callProxy<StructuredFeedback>('closedLoop', { scenario, history });
}

export async function getChatResponse(history: Message[], systemInstruction: string): Promise<string> {
    const data = await callProxy<{ text: string }>('chat', { history, systemInstruction });
    return data.text;
}

export async function generateQuizQuestions(numberOfQuestions: number = 8): Promise<QuizQuestion[]> {
  return callProxy<QuizQuestion[]>('quiz', { numberOfQuestions });
}
