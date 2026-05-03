export type AnswerValue = string;

export type ExamPhase = "select" | "cover" | "exam" | "scoring" | "review" | "editor";

export type ProblemBlock =
  | {
      type: "heading";
      text: string;
      level?: 2 | 3;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "formula";
      latex: string;
    }
  | {
      type: "question";
      questionId: string;
    }
  | {
      type: "figure";
      caption: string;
      alt: string;
      imageUrl?: string;
      tikz?: string;
    }
  | {
      type: "note";
      text: string;
    };

export interface MarkOption {
  value: AnswerValue;
  label: string;
  content: string;
}

export interface QuestionSlot {
  id: string;
  label: string;
  section: string;
  prompt: string;
  pageId: string;
  points: number;
  multi: boolean;
  options: MarkOption[];
  correct: AnswerValue[];
  explanation: string;
}

export interface ExamPage {
  id: string;
  pageNumber: number;
  title: string;
  blocks: ProblemBlock[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  published: boolean;
  totalPoints: number;
  description: string;
  instructions: string[];
  pages: ExamPage[];
  questions: QuestionSlot[];
}

export type UserAnswers = Record<string, AnswerValue[]>;

export interface GradedQuestion {
  question: QuestionSlot;
  userAnswer: AnswerValue[];
  correctAnswer: AnswerValue[];
  isCorrect: boolean;
  earnedPoints: number;
  status: "correct" | "incorrect" | "unanswered";
}

export interface GradeSummary {
  totalScore: number;
  totalPoints: number;
  gradedQuestions: GradedQuestion[];
}
