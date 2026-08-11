import { useCallback, useEffect, useState } from "react";
import { AuthoringEditor } from "./components/authoring/AuthoringEditor";
import { CoverPage } from "./components/home/CoverPage";
import { ExamList } from "./components/home/ExamList";
import { ExamRunner } from "./components/exam/ExamRunner";
import { ScoringScreen } from "./components/scoring/ScoringScreen";
import { sampleExams } from "./data/sampleExam";
import type { AnswerValue, Exam, ExamPhase, QuestionSlot, UserAnswers } from "./types";
import { clearAnswers, clearDeadline, loadAnswers, saveAnswers, saveDeadline } from "./utils/storage";
import { toggleAnswer } from "./utils/answer";

export function App() {
  const [phase, setPhase] = useState<ExamPhase>("select");
  const [exams, setExams] = useState<Exam[]>(sampleExams);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>("");
  const [showCompletedScoring, setShowCompletedScoring] = useState(false);
  const [reviewFadeIn, setReviewFadeIn] = useState(false);
  const [reviewUiVisible, setReviewUiVisible] = useState(false);
  const [reviewUiSettled, setReviewUiSettled] = useState(false);

  const openCover = (exam: Exam) => {
    setSelectedExam(exam);
    setAnswers(loadAnswers(exam.id));
    setDeadline(null);
    setCurrentPageId(exam.pages[0]?.id ?? "");
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("cover");
  };

  const startExam = () => {
    if (!selectedExam) {
      return;
    }

    const nextDeadline = Date.now() + selectedExam.durationMinutes * 60 * 1000;
    clearAnswers(selectedExam.id);
    setAnswers({});
    setDeadline(nextDeadline);
    saveDeadline(selectedExam.id, nextDeadline);
    setCurrentPageId(selectedExam.pages[0]?.id ?? "");
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("exam");
  };

  const resetToList = () => {
    if (selectedExam) {
      clearDeadline(selectedExam.id);
    }
    setSelectedExam(null);
    setDeadline(null);
    setCurrentPageId("");
    setShowCompletedScoring(false);
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("select");
  };

  const discardExamAndReturnHome = useCallback(() => {
    if (selectedExam) {
      clearAnswers(selectedExam.id);
      clearDeadline(selectedExam.id);
    }
    setAnswers({});
    setSelectedExam(null);
    setDeadline(null);
    setCurrentPageId("");
    setShowCompletedScoring(false);
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("select");
  }, [selectedExam]);

  const deleteExam = (examId: string) => {
    setExams((current) => current.filter((exam) => exam.id !== examId));
    if (selectedExam?.id === examId) {
      resetToList();
    }
  };

  const finishExam = useCallback(() => {
    if (selectedExam) {
      clearDeadline(selectedExam.id);
    }
    setDeadline(null);
    setShowCompletedScoring(false);
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("scoring");
  }, [selectedExam]);

  const openNewEditor = () => {
    setEditingExam(null);
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("editor");
  };

  const openExamEditor = (exam: Exam) => {
    setEditingExam(exam);
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("editor");
  };

  const publishExam = (exam: Exam) => {
    setExams((current) => {
      const existingIndex = current.findIndex((item) => item.id === exam.id);
      if (existingIndex === -1) {
        return [...current, exam];
      }

      return current.map((item) => (item.id === exam.id ? exam : item));
    });
    setEditingExam(null);
    setReviewFadeIn(false);
    setReviewUiVisible(false);
    setReviewUiSettled(false);
    setPhase("select");
  };

  const handleToggleAnswer = (question: QuestionSlot, value: AnswerValue) => {
    setAnswers((current) => ({
      ...current,
      [question.id]: toggleAnswer(question, current[question.id], value)
    }));
  };

  useEffect(() => {
    if (selectedExam) {
      saveAnswers(selectedExam.id, answers);
    }
  }, [answers, selectedExam]);

  useEffect(() => {
    if (phase !== "review" || !reviewFadeIn) {
      setReviewUiVisible(false);
      setReviewUiSettled(false);
      return undefined;
    }

    const showTimeoutId = window.setTimeout(() => setReviewUiVisible(true), 0);
    const settleTimeoutId = window.setTimeout(() => setReviewUiSettled(true), 620);
    return () => {
      window.clearTimeout(showTimeoutId);
      window.clearTimeout(settleTimeoutId);
    };
  }, [phase, reviewFadeIn]);

  if (phase === "editor") {
    return (
      <AuthoringEditor
        initialExam={editingExam}
        key={editingExam?.id ?? "new"}
        onBack={() => {
          setEditingExam(null);
          setPhase("select");
        }}
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
        onOpenEditor={openNewEditor}
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
          setShowCompletedScoring(true);
          setCurrentPageId(selectedExam.pages[0]?.id ?? "");
          setReviewFadeIn(true);
          setReviewUiVisible(false);
          setReviewUiSettled(false);
          setPhase("review");
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
      className={
        [
          reviewFadeIn ? "review-mode-fade-in" : "",
          reviewFadeIn && reviewUiVisible ? "review-mode-fade-in-ready" : "",
          reviewFadeIn && reviewUiSettled ? "review-mode-fade-in-settled" : ""
        ]
          .filter(Boolean)
          .join(" ") || undefined
      }
      reviewMode={phase === "review"}
      onChangePage={setCurrentPageId}
      onExitReview={discardExamAndReturnHome}
      onExpire={finishExam}
      onFinish={finishExam}
      onReturnHome={discardExamAndReturnHome}
      onToggleAnswer={handleToggleAnswer}
    />
  );
}
