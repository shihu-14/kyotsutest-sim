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
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>("");

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
    setPhase("scoring");
  }, [selectedExam]);

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
    return <AuthoringEditor onBack={() => setPhase("select")} />;
  }

  if (phase === "select" || !selectedExam) {
    return (
      <ExamList
        exams={exams}
        onDelete={deleteExam}
        onEdit={() => setPhase("editor")}
        onOpenEditor={() => setPhase("editor")}
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
        onRestart={() => {
          clearAnswers(selectedExam.id);
          clearDeadline(selectedExam.id);
          resetToList();
        }}
        onReview={() => {
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
      onToggleAnswer={handleToggleAnswer}
    />
  );
}
