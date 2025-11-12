

import { GoogleGenAI, Type } from "@google/genai";
import { Message, StructuredFeedback, QuizQuestion } from '../types';

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
  try {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'closedLoop',
        payload: { scenario, history }
      }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Serverfejl: ${response.status}`);
    }
    const data = await response.json();
    return data as StructuredFeedback;
  } catch (error) {
    console.error("Error calling proxy for Closed Loop feedback:", error);
    throw new Error("Kunne ikke hente feedback fra AI-agenten. Tjek konsollen for detaljer.");
  }
}

export async function getChatResponse(history: Message[], systemInstruction: string): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat',
        payload: { history, systemInstruction }
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Serverfejl: ${response.status}`);
    }

    const data = await response.json();
    return data.text as string;
  } catch (error) {
    console.error("Error calling proxy for Chat response:", error);
    throw new Error("Kunne ikke få svar fra AI-agenten. Tjek konsollen for detaljer.");
  }
}

export async function generateQuizQuestions(numberOfQuestions: number = 8): Promise<QuizQuestion[]> {
  try {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'quiz',
        payload: { numberOfQuestions }
      }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Serverfejl: ${response.status}`);
    }
    const data = await response.json();
    return data as QuizQuestion[];
  } catch (error) {
    console.error("Error calling proxy for Quiz questions:", error);
    throw new Error("Kunne ikke generere quiz-spørgsmål fra AI-agenten. Tjek konsollen for detaljer.");
  }
}