import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type WheelEvent } from "react";
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
  onPause: () => void;
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
  onPause,
  onExitReview,
  onExpire
}: ExamRunnerProps) {
  const [bookletZoom, setBookletZoom] = useState(1);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const bookletStageRef = useRef<HTMLDivElement | null>(null);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const page = exam.pages.find((candidate) => candidate.id === currentPageId) ?? exam.pages[0];
  const pageIndex = exam.pages.findIndex((candidate) => candidate.id === page.id);
  const countdown = useCountdown(reviewMode ? null : deadline, onExpire);
  const completeCount = answeredCount(exam, answers);
  const bookletStyle = { "--booklet-zoom": String(bookletZoom) } as CSSProperties;

  const goPrevious = () => {
    const previousPage = exam.pages[Math.max(0, pageIndex - 1)];
    onChangePage(previousPage.id);
  };

  const goNext = () => {
    const nextPage = exam.pages[Math.min(exam.pages.length - 1, pageIndex + 1)];
    onChangePage(nextPage.id);
  };

  const updateBookletZoom = (value: number) => {
    setBookletZoom(Math.min(1.6, Math.max(0.75, value)));
  };

  useEffect(() => {
    const stage = bookletStageRef.current;
    if (!stage) {
      return undefined;
    }

    const preventPageZoom = (event: globalThis.WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
    };

    stage.addEventListener("wheel", preventPageZoom, { passive: false });
    return () => stage.removeEventListener("wheel", preventPageZoom);
  }, []);

  const handleBookletWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    updateBookletZoom(bookletZoom + (event.deltaY < 0 ? 0.08 : -0.08));
  };

  const handleBookletKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      updateBookletZoom(bookletZoom + 0.08);
    }

    if (event.key === "-") {
      event.preventDefault();
      updateBookletZoom(bookletZoom - 0.08);
    }
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
            <>
              <button className="secondary-button" type="button" onClick={() => setShowPauseConfirm(true)}>
                中断
              </button>
              <button className="danger-button" type="button" onClick={() => setShowFinishConfirm(true)}>
                試験終了
              </button>
            </>
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
          <div
            aria-label="問題表示領域"
            className="booklet-stage"
            ref={bookletStageRef}
            style={bookletStyle}
            tabIndex={0}
            onKeyDown={handleBookletKeyDown}
            onWheel={handleBookletWheel}
          >
            <div className={`booklet-scroll-surface ${page.pageImageUrl ? "exact-scroll-surface" : ""}`}>
              <ProblemBooklet
                answers={answers}
                page={page}
                questionsById={questionsById}
                reviewMode={reviewMode}
                onToggleAnswer={onToggleAnswer}
              />
            </div>
          </div>
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

      {showFinishConfirm ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="finish-dialog-title">
            <h2 id="finish-dialog-title">試験を終了しますか</h2>
            <p>時間はまだ残っています。終了すると採点に進みます。</p>
            <div className="dialog-actions">
              <button className="secondary-button" type="button" onClick={() => setShowFinishConfirm(false)}>
                戻る
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  setShowFinishConfirm(false);
                  onFinish();
                }}
              >
                採点へ進む
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showPauseConfirm ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-dialog-title">
            <h2 id="pause-dialog-title">試験を中断しますか</h2>
            <p>現在の解答は保持されます。採点せずに一覧へ戻ります。</p>
            <div className="dialog-actions">
              <button className="secondary-button" type="button" onClick={() => setShowPauseConfirm(false)}>
                戻る
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  setShowPauseConfirm(false);
                  onPause();
                }}
              >
                中断する
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
