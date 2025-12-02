
export interface IsbarInput {
  identifikation: string;
  situation: string;
  baggrund: string;
  analyse: string;
  anbefaling: string;
}

export interface ScenarioData {
  title: string;
  description: string;
}

export type Message = {
  role: 'user' | 'model';
  text: string;
};

export interface FeedbackSection {
  title: string;
  rating: 'God' | 'Tilstrækkelig' | 'Kræver forbedring';
  points: string[];
}

export interface StructuredFeedback {
  opening: string;
  sections: FeedbackSection[];
  conclusion: string;
}

export interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: string[]; // Altid et array for konsistens
}
