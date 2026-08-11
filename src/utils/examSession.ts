import type { AnswerValue, Exam, ExamPhase, QuestionSlot, UserAnswers } from "../types";
import { toggleAnswer } from "./answer";

export interface ExamSessionState {
  answers: UserAnswers;
  currentPageId: string;
  deadline: number | null;
  editingExam: Exam | null;
  phase: ExamPhase;
  selectedExam: Exam | null;
  showCompletedScoring: boolean;
}

export type ExamSessionEvent =
  | { type: "OPEN_COVER"; exam: Exam; answers: UserAnswers }
  | { type: "START_EXAM"; deadline: number }
  | { type: "FINISH_EXAM" }
  | { type: "ENTER_REVIEW" }
  | { type: "RESET_TO_LIST" }
  | { type: "DISCARD_TO_LIST" }
  | { type: "OPEN_EDITOR"; exam: Exam }
  | { type: "CLOSE_EDITOR" }
  | { type: "CHANGE_PAGE"; pageId: string }
  | { type: "TOGGLE_ANSWER"; question: QuestionSlot; value: AnswerValue };

export const initialExamSessionState: ExamSessionState = {
  answers: {},
  currentPageId: "",
  deadline: null,
  editingExam: null,
  phase: "select",
  selectedExam: null,
  showCompletedScoring: false
};

export function examSessionReducer(state: ExamSessionState, event: ExamSessionEvent): ExamSessionState {
  switch (event.type) {
    case "OPEN_COVER":
      return {
        ...state,
        answers: event.answers,
        currentPageId: event.exam.pages[0]?.id ?? "",
        deadline: null,
        phase: "cover",
        selectedExam: event.exam
      };
    case "START_EXAM":
      if (!state.selectedExam) {
        return state;
      }
      return {
        ...state,
        answers: {},
        currentPageId: state.selectedExam.pages[0]?.id ?? "",
        deadline: event.deadline,
        phase: "exam"
      };
    case "FINISH_EXAM":
      return {
        ...state,
        deadline: null,
        phase: "scoring",
        showCompletedScoring: false
      };
    case "ENTER_REVIEW":
      return {
        ...state,
        currentPageId: state.selectedExam?.pages[0]?.id ?? "",
        phase: "review",
        showCompletedScoring: true
      };
    case "RESET_TO_LIST":
      return {
        ...state,
        currentPageId: "",
        deadline: null,
        phase: "select",
        selectedExam: null,
        showCompletedScoring: false
      };
    case "DISCARD_TO_LIST":
      return {
        ...state,
        answers: {},
        currentPageId: "",
        deadline: null,
        phase: "select",
        selectedExam: null,
        showCompletedScoring: false
      };
    case "OPEN_EDITOR":
      return { ...state, editingExam: event.exam, phase: "editor" };
    case "CLOSE_EDITOR":
      return { ...state, editingExam: null, phase: "select" };
    case "CHANGE_PAGE":
      return { ...state, currentPageId: event.pageId };
    case "TOGGLE_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [event.question.id]: toggleAnswer(event.question, state.answers[event.question.id], event.value)
        }
      };
  }
}
