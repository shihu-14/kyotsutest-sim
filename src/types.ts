export type AnswerValue = string;

export type ExamPhase = "select" | "cover" | "exam" | "scoring" | "review";

export interface MarkOption {
  value: AnswerValue;
  label: string;
}

export interface QuestionSlot {
  id: string;
  label: string;
  section: string;
  pageId: string;
  points: number;
  multi: boolean;
  options: MarkOption[];
  correct: AnswerValue[];
}

export interface PageMarkArea {
  questionId: string;
  value: AnswerValue;
  xPercent: number;
  yPercent: number;
  widthPercent?: number;
  heightPercent?: number;
}

export interface PageGradeAnchor {
  questionId: string;
  xPercent: number;
  yPercent: number;
  widthPercent?: number;
}

export interface CoverMarkArea {
  id: string;
  label: string;
  value: AnswerValue;
  xPercent: number;
  yPercent: number;
  widthPercent?: number;
  heightPercent?: number;
}

export interface ExamPage {
  id: string;
  pageNumber: number;
  title: string;
  pageImageUrl: string;
  pageImageAlt?: string;
  markAreas?: PageMarkArea[];
  gradeAnchors?: PageGradeAnchor[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  published: boolean;
  totalPoints: number;
  coverImageUrl?: string;
  coverMarkAreas?: CoverMarkArea[];
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
