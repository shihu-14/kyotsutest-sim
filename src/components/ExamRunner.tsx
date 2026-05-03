import { useMemo } from "react";
import type { AnswerValue, Exam, QuestionSlot, UserAnswers } from "../types";
import { answeredCount } from "../utils/answer";
import { useCountdown } from "../hooks/useCountdown";
import { MarkSheet } from "./MarkSheet";
import { ProblemBooklet } from "./ProblemBooklet";

interface ExamRunnerProps {
  exam: Exam;
  answers: UserAnswers;
  currentPageId: string;
  deadline: number | null;
  reviewMode?: boolean;
  onChangePage: (pageId: string) => void;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
  onFinish: () => void;
  onExitReview?: () => void;
  onExpire: () => void;
}

export function ExamRunner({
  exam,
  answers,
  currentPageId,
  deadline,
  reviewMode = false,
  onChangePage,
  onToggleAnswer,
  onFinish,
  onExitReview,
  onExpire
}: ExamRunnerProps) {
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const page = exam.pages.find((candidate) => candidate.id === currentPageId) ?? exam.pages[0];
  const pageIndex = exam.pages.findIndex((candidate) => candidate.id === page.id);
  const countdown = useCountdown(reviewMode ? null : deadline, onExpire);
  const completeCount = answeredCount(exam, answers);

  const goPrevious = () => {
    const previousPage = exam.pages[Math.max(0, pageIndex - 1)];
    onChangePage(previousPage.id);
  };

  const goNext = () => {
    const nextPage = exam.pages[Math.min(exam.pages.length - 1, pageIndex + 1)];
    onChangePage(nextPage.id);
  };

  return (
    <main className="exam-layout">
      <header className="exam-toolbar">
        <div>
          <p className="eyebrow">{reviewMode ? "Review mode" : "Exam mode"}</p>
          <h1>{exam.title}</h1>
        </div>
        <div className="toolbar-metrics">
          <div className="metric">
            <span>解答済み</span>
            <strong>
              {completeCount}/{exam.questions.length}
            </strong>
          </div>
          {!reviewMode ? (
            <div className={`timer ${countdown.remainingMs <= 60_000 ? "urgent" : ""}`} aria-live="polite">
              {countdown.formatted}
            </div>
          ) : null}
          {reviewMode ? (
            <button className="secondary-button" type="button" onClick={onExitReview}>
              結果へ戻る
            </button>
          ) : (
            <button className="danger-button" type="button" onClick={onFinish}>
              試験終了
            </button>
          )}
        </div>
      </header>

      <section className="exam-body">
        <div className="booklet-shell">
          <nav className="page-tabs" aria-label="問題ページ">
            {exam.pages.map((item) => (
              <button
                className={item.id === page.id ? "active" : ""}
                key={item.id}
                type="button"
                onClick={() => onChangePage(item.id)}
              >
                {item.pageNumber}
              </button>
            ))}
          </nav>
          <ProblemBooklet
            answers={answers}
            page={page}
            questionsById={questionsById}
            reviewMode={reviewMode}
            onToggleAnswer={onToggleAnswer}
          />
          <div className="page-turner">
            <button className="secondary-button" disabled={pageIndex === 0} type="button" onClick={goPrevious}>
              前のページ
            </button>
            <span>
              {pageIndex + 1} / {exam.pages.length}
            </span>
            <button
              className="secondary-button"
              disabled={pageIndex === exam.pages.length - 1}
              type="button"
              onClick={goNext}
            >
              次のページ
            </button>
          </div>
        </div>
        <MarkSheet
          activePageId={page.id}
          answers={answers}
          exam={exam}
          reviewMode={reviewMode}
          onJumpToPage={onChangePage}
          onToggleAnswer={onToggleAnswer}
        />
      </section>
    </main>
  );
}
