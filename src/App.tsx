import { ExamRunner } from "./components/exam/ExamRunner";
import { CoverPage } from "./components/home/CoverPage";
import { ExamList } from "./components/home/ExamList";
import { ScoringScreen } from "./components/scoring/ScoringScreen";
import { initialExams } from "./data/initialExams";
import { useExamSession } from "./hooks/useExamSession";
import { useReviewTransition } from "./hooks/useReviewTransition";
import type { Exam } from "./types";

export function App() {
  const {
    changePage,
    discardExamAndReturnHome: discardSession,
    enterReview,
    finishExam: finishSession,
    openCover: openSessionCover,
    resetToList: resetSessionToList,
    startExam: startSessionExam,
    state: { answers, currentPageId, deadline, phase, selectedExam, showCompletedScoring },
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
