export interface QuestionOption {
  letter: string;
  text: string;
  anchor: string;
}

export interface Question {
  id: number;
  text: string;
  options: QuestionOption[];
}

export interface CareerAnchor {
  code: string;
  name: string;
  englishName: string;
  description: string;
  traits: string[];
  careers: string[];
  color: string;
  emoji: string;
}

export interface UserResponse {
  questionId: number;
  value: string; // 'A' ~ 'H'
}

export interface CareerAnchorResult {
  type: CareerAnchor;
  secondaryType: CareerAnchor | null;
  primary: string; // e.g. "TF" or "TF+SV"
  scores: Record<string, number>; // anchor counts: { TF: 3, GM: 2, ... }
  counts: Record<string, number>; // raw letter counts: { A: 3, B: 2, ... }
}
