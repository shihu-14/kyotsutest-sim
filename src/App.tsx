import { useCallback, useEffect, useState } from "react";
import { AuthoringEditor } from "./components/AuthoringEditor";
import { CoverPage } from "./components/CoverPage";
import { ExamList } from "./components/ExamList";
import { ExamRunner } from "./components/ExamRunner";
import { ScoringScreen } from "./components/ScoringScreen";
import { sampleExams } from "./data/sampleExam";
import type { AnswerValue, Exam, ExamPhase, QuestionSlot, UserAnswers } from "./types";
import { clearAnswers, clearDeadline, loadAnswers, loadDeadline, saveAnswers, saveDeadline } from "./utils/storage";
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

  const openCover = (exam: Exam) => {
    setSelectedExam(exam);
    setAnswers(loadAnswers(exam.id));
    setDeadline(loadDeadline(exam.id));
    setCurrentPageId(exam.pages[0]?.id ?? "");
    setPhase("cover");
  };

  const startExam = () => {
    if (!selectedExam) {
      return;
    }

    const nextDeadline = Date.now() + selectedExam.durationMinutes * 60 * 1000;
    setAnswers(loadAnswers(selectedExam.id));
    setDeadline(nextDeadline);
    saveDeadline(selectedExam.id, nextDeadline);
    setCurrentPageId(selectedExam.pages[0]?.id ?? "");
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
    setPhase("select");
  };

  const pauseExam = () => {
    setSelectedExam(null);
    setDeadline(null);
    setCurrentPageId("");
    setShowCompletedScoring(false);
    setPhase("select");
  };

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
    setPhase("scoring");
  }, [selectedExam]);

  const openNewEditor = () => {
    setEditingExam(null);
    setPhase("editor");
  };

  const openExamEditor = (exam: Exam) => {
    setEditingExam(exam);
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
        onRestart={() => {
          clearAnswers(selectedExam.id);
          clearDeadline(selectedExam.id);
          resetToList();
        }}
        onReview={() => {
          setShowCompletedScoring(true);
          setCurrentPageId(selectedExam.pages[0]?.id ?? "");
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
      reviewMode={phase === "review"}
      onChangePage={setCurrentPageId}
      onExitReview={() => setPhase("scoring")}
      onExpire={finishExam}
      onFinish={finishExam}
      onPause={pauseExam}
      onToggleAnswer={handleToggleAnswer}
    />
  );
}
