import { useCallback, useEffect, useReducer } from "react";
import type { AnswerValue, Exam, QuestionSlot } from "../types";
import {
  examSessionReducer,
  initialExamSessionState
} from "../utils/examSession";
import {
  clearAnswers,
  clearDeadline,
  loadAnswers,
  saveAnswers,
  saveDeadline
} from "../utils/storage";

export function useExamSession() {
  const [state, dispatch] = useReducer(examSessionReducer, initialExamSessionState);

  const openCover = useCallback((exam: Exam) => {
    dispatch({ type: "OPEN_COVER", exam, answers: loadAnswers(exam.id) });
  }, []);

  const startExam = useCallback(() => {
    if (!state.selectedExam) {
      return;
    }

    const deadline = Date.now() + state.selectedExam.durationMinutes * 60 * 1000;
    clearAnswers(state.selectedExam.id);
    saveDeadline(state.selectedExam.id, deadline);
    dispatch({ type: "START_EXAM", deadline });
  }, [state.selectedExam]);

  const resetToList = useCallback(() => {
    if (state.selectedExam) {
      clearDeadline(state.selectedExam.id);
    }
    dispatch({ type: "RESET_TO_LIST" });
  }, [state.selectedExam]);

  const discardExamAndReturnHome = useCallback(() => {
    if (state.selectedExam) {
      clearAnswers(state.selectedExam.id);
      clearDeadline(state.selectedExam.id);
    }
    dispatch({ type: "DISCARD_TO_LIST" });
  }, [state.selectedExam]);

  const finishExam = useCallback(() => {
    if (state.selectedExam) {
      clearDeadline(state.selectedExam.id);
    }
    dispatch({ type: "FINISH_EXAM" });
  }, [state.selectedExam]);

  const enterReview = useCallback(() => dispatch({ type: "ENTER_REVIEW" }), []);
  const openNewEditor = useCallback(() => dispatch({ type: "OPEN_NEW_EDITOR" }), []);
  const openExamEditor = useCallback((exam: Exam) => dispatch({ type: "OPEN_EDITOR", exam }), []);
  const closeEditor = useCallback(() => dispatch({ type: "CLOSE_EDITOR" }), []);
  const changePage = useCallback((pageId: string) => dispatch({ type: "CHANGE_PAGE", pageId }), []);
  const toggleSessionAnswer = useCallback(
    (question: QuestionSlot, value: AnswerValue) => dispatch({ type: "TOGGLE_ANSWER", question, value }),
    []
  );

  useEffect(() => {
    if (state.selectedExam) {
      saveAnswers(state.selectedExam.id, state.answers);
    }
  }, [state.answers, state.selectedExam]);

  return {
    changePage,
    closeEditor,
    discardExamAndReturnHome,
    enterReview,
    finishExam,
    openCover,
    openExamEditor,
    openNewEditor,
    resetToList,
    startExam,
    state,
    toggleAnswer: toggleSessionAnswer
  };
}
