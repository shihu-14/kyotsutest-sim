import { useState } from "react";
import { AuthoringEditor } from "./components/authoring/AuthoringEditor";
import { ExamRunner } from "./components/exam/ExamRunner";
import { CoverPage } from "./components/home/CoverPage";
import { ExamList } from "./components/home/ExamList";
import { ScoringScreen } from "./components/scoring/ScoringScreen";
import { initialExams } from "./data/initialExams";
import { useExamSession } from "./hooks/useExamSession";
import { useReviewTransition } from "./hooks/useReviewTransition";
import type { Exam } from "./types";

export function App() {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const {
    changePage,
    closeEditor,
    discardExamAndReturnHome: discardSession,
    enterReview,
    finishExam: finishSession,
    openCover: openSessionCover,
    openExamEditor: openSessionEditor,
    resetToList: resetSessionToList,
    startExam: startSessionExam,
    state: {
      answers,
      currentPageId,
      deadline,
      editingExam,
      phase,
      selectedExam,
      showCompletedScoring
    },
    toggleAnswer
  } = useExamSession();
  const { className: reviewTransitionClassName, resetReviewTransition, startReviewTransition } =
    useReviewTransition();

  const openCover = (exam: Exam) => {
    resetReviewTransition();
    openSessionCover(exam);
  };

  const startExam = () => {
    resetReviewTransition();
    startSessionExam();
  };

  const resetToList = () => {
    resetReviewTransition();
    resetSessionToList();
  };

  const discardExamAndReturnHome = () => {
    resetReviewTransition();
    discardSession();
  };

  const finishExam = () => {
    resetReviewTransition();
    finishSession();
  };

  const openExamEditor = (exam: Exam) => {
    resetReviewTransition();
    openSessionEditor(exam);
  };

  const publishExam = (exam: Exam) => {
    setExams((current) => {
      const existingIndex = current.findIndex((item) => item.id === exam.id);
      if (existingIndex === -1) {
        return [...current, exam];
      }

      return current.map((item) => (item.id === exam.id ? exam : item));
    });
    resetReviewTransition();
    closeEditor();
  };

  const deleteExam = (examId: string) => {
    setExams((current) => current.filter((exam) => exam.id !== examId));
    if (selectedExam?.id === examId) {
      resetToList();
    }
  };

  if (phase === "editor") {
    return (
      <AuthoringEditor
        initialExam={editingExam}
        key={editingExam?.id ?? "new"}
        onBack={closeEditor}
        onPublish={publishExam}
      />
    );
  }

  if (phase === "select" || !selectedExam) {
    return (
      <ExamList
        exams={exams}
        onDelete={deleteExam}
        onEdit={openExamEditor}
        onSelect={openCover}
      />
    );
  }

  if (phase === "cover") {
    return <CoverPage exam={selectedExam} onBack={resetToList} onStart={startExam} />;
  }

  if (phase === "scoring") {
    return (
      <ScoringScreen
        answers={answers}
        exam={selectedExam}
        startComplete={showCompletedScoring}
        onReview={() => {
          enterReview();
          startReviewTransition();
        }}
      />
    );
  }

  return (
    <ExamRunner
      answers={answers}
      currentPageId={currentPageId}
      deadline={deadline}
      exam={selectedExam}
      className={reviewTransitionClassName}
      reviewMode={phase === "review"}
      onChangePage={changePage}
      onExitReview={discardExamAndReturnHome}
      onExpire={finishExam}
      onFinish={finishExam}
      onReturnHome={discardExamAndReturnHome}
      onToggleAnswer={toggleAnswer}
    />
  );
}
