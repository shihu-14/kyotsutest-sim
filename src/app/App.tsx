import { ExamRunner } from "../features/exam/ExamRunner";
import { CoverPage } from "../features/exam/CoverPage";
import { ExamList } from "../features/home/ExamList";
import { ScoringScreen } from "../features/exam/ScoringScreen";
import { initialExams } from "../data/exams/anime-onlymark-2026/exam";
import { useExamSession } from "./useExamSession";
import { useReviewTransition } from "./useReviewTransition";
import type { Exam } from "../domain/exam";

export function App() {
  const {
    changePage,
    discardExamAndReturnHome: discardSession,
    enterReview,
    finishExam: finishSession,
    openCover: openSessionCover,
    resetToList: resetSessionToList,
    startExam: startSessionExam,
    state: { answers, currentPageId, deadline, phase, selectedExam },
    toggleAnswer
  } = useExamSession();
  const { className: reviewTransitionClassName, resetReviewTransition, startReviewTransition } = useReviewTransition();

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

  if (phase === "select" || !selectedExam) {
    return <ExamList exams={initialExams} onSelect={openCover} />;
  }

  if (phase === "cover") {
    return <CoverPage exam={selectedExam} onBack={resetToList} onStart={startExam} />;
  }

  if (phase === "scoring") {
    return (
      <ScoringScreen
        answers={answers}
        exam={selectedExam}
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
