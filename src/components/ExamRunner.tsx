import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type WheelEvent } from "react";
import type { AnswerValue, Exam, QuestionSlot, UserAnswers } from "../types";
import { useCountdown } from "../hooks/useCountdown";
import { MarkSheet } from "./MarkSheet";
import { ProblemBooklet } from "./ProblemBooklet";
import { StopwatchTimer } from "./StopwatchTimer";

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
  onReturnHome?: () => void;
  onExpire: () => void;
}

const timerAccentColor = "#ff4d00";
const homeActionColor = "#fffaf1";
const actionButtonWidth = "128px";
const visiblePageTabCount = 12;

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
  onReturnHome,
  onExpire
}: ExamRunnerProps) {
  const [bookletZoom, setBookletZoom] = useState(1);
  const [showCover, setShowCover] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const bookletStageRef = useRef<HTMLDivElement | null>(null);
  const pageTabsRef = useRef<HTMLDivElement | null>(null);
  const pageNavigationSourceRef = useRef<"arrow" | "tab" | null>(null);
  const previousPagePositionRef = useRef<number | null>(null);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const page = exam.pages.find((candidate) => candidate.id === currentPageId) ?? exam.pages[0];
  const pageIndex = exam.pages.findIndex((candidate) => candidate.id === page.id);
  const countdown = useCountdown(reviewMode ? null : deadline, onExpire);
  const bookletStyle = { "--booklet-zoom": String(bookletZoom) } as CSSProperties;
  const pageTabsStyle = {
    "--visible-page-tabs": String(Math.min(exam.pages.length, visiblePageTabCount)),
    "--has-cover-tab": exam.coverImageUrl ? "1" : "0"
  } as CSSProperties;
  const finishColorStyle = {
    "--finish-color": timerAccentColor,
    backgroundColor: timerAccentColor,
    color: "#ffffff"
  } as CSSProperties;
  const homeColorStyle = {
    "--home-action-color": homeActionColor,
    backgroundColor: homeActionColor,
    width: actionButtonWidth
  } as CSSProperties;
  const totalTimeMs = exam.durationMinutes * 60 * 1000;
  const canGoPrevious = showCover ? false : pageIndex > 0 || Boolean(exam.coverImageUrl);
  const canGoNext = showCover ? exam.pages.length > 0 : pageIndex < exam.pages.length - 1;

  const goPrevious = () => {
    if (showCover) {
      return;
    }

    if (pageIndex === 0 && exam.coverImageUrl) {
      setShowCover(true);
      return;
    }

    const previousPage = exam.pages[Math.max(0, pageIndex - 1)];
    pageNavigationSourceRef.current = "arrow";
    onChangePage(previousPage.id);
  };

  const goNext = () => {
    if (showCover) {
      setShowCover(false);
      onChangePage(exam.pages[0]?.id ?? currentPageId);
      return;
    }

    const nextPage = exam.pages[Math.min(exam.pages.length - 1, pageIndex + 1)];
    pageNavigationSourceRef.current = "arrow";
    onChangePage(nextPage.id);
  };

  const updateBookletZoom = (value: number) => {
    setBookletZoom(Math.min(1.6, Math.max(1, value)));
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

  useEffect(() => {
    const nav = pageTabsRef.current;
    const activeTab = nav?.querySelector<HTMLButtonElement>(".active");
    const currentPosition = showCover ? -1 : pageIndex;
    const previousPosition = previousPagePositionRef.current;
    const navigationSource = pageNavigationSourceRef.current;
    pageNavigationSourceRef.current = null;
    previousPagePositionRef.current = currentPosition;

    if (!nav || !activeTab || nav.scrollWidth <= nav.clientWidth) {
      return;
    }

    const leftEdge = activeTab.offsetLeft - nav.offsetLeft;
    const rightEdge = leftEdge + activeTab.offsetWidth;
    const visibleLeft = nav.scrollLeft;
    const visibleRight = nav.scrollLeft + nav.clientWidth;
    const maxScrollLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
    const scrollTo = (left: number) => {
      nav.scrollTo({ left: Math.min(maxScrollLeft, Math.max(0, left)), behavior: "smooth" });
    };

    if (navigationSource === "arrow" && previousPosition !== null && currentPosition > previousPosition) {
      scrollTo(rightEdge - nav.clientWidth);
      return;
    }

    if (navigationSource === "arrow" && previousPosition !== null && currentPosition < previousPosition) {
      scrollTo(rightEdge - nav.clientWidth);
      return;
    }

    if (rightEdge > visibleRight) {
      scrollTo(rightEdge - nav.clientWidth);
      return;
    }

    if (leftEdge < visibleLeft) {
      scrollTo(leftEdge);
    }
  }, [currentPageId, exam.pages.length, showCover]);

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

  const handlePageTabsWheel = (event: WheelEvent<HTMLElement>) => {
    const nav = pageTabsRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }

    event.preventDefault();
    nav.scrollLeft += event.deltaY;
  };

  return (
    <main className="exam-layout exam-mode-background">
      <header className="exam-toolbar" aria-label="試験操作">
        <div className="toolbar-metrics">
          {!reviewMode ? (
            <StopwatchTimer
              formatted={countdown.formatted}
              label={`残り時間 ${countdown.formatted}`}
              remainingMs={countdown.remainingMs}
              totalMs={totalTimeMs}
              variant="timer-exam-seal timer-color-stadium-alert"
            />
          ) : null}
          {reviewMode ? (
            <button className="secondary-button" type="button" onClick={onExitReview}>
              結果へ戻る
            </button>
          ) : (
            <div className="finish-action-stack">
              {onReturnHome ? (
                <button
                  className="secondary-button home-return-button"
                  style={homeColorStyle}
                  type="button"
                  onClick={onReturnHome}
                >
                  ホームに戻る
                </button>
              ) : null}
              <button
                className="danger-button finish-button"
                style={finishColorStyle}
                type="button"
                onClick={() => setShowFinishConfirm(true)}
              >
                採点へ進む
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="exam-body">
        <div className="booklet-shell">
          <nav className="page-tabs" aria-label="問題ページ" style={pageTabsStyle}>
            {exam.coverImageUrl ? (
              <button
                className={showCover ? "active cover-tab" : "cover-tab"}
                type="button"
                onClick={() => setShowCover(true)}
              >
                表紙
              </button>
            ) : null}
            <div className="page-tab-scroll" ref={pageTabsRef} onWheel={handlePageTabsWheel}>
              {exam.pages.map((item) => (
                <button
                  className={!showCover && item.id === page.id ? "active" : ""}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    pageNavigationSourceRef.current = "tab";
                    setShowCover(false);
                    onChangePage(item.id);
                  }}
                >
                  {item.pageNumber}
                </button>
              ))}
            </div>
          </nav>
          <div className="booklet-stage-shell">
            {canGoPrevious ? (
              <button
                aria-label="前のページへ"
                className="booklet-side-arrow previous"
                type="button"
                onClick={goPrevious}
              >
                ‹
              </button>
            ) : null}
            <div
              aria-label="問題表示領域"
              className="booklet-stage"
              ref={bookletStageRef}
              style={bookletStyle}
              tabIndex={0}
              onKeyDown={handleBookletKeyDown}
              onWheel={handleBookletWheel}
            >
              <div className="booklet-scroll-surface exact-scroll-surface">
                {showCover ? (
                  <article className="booklet-page exact-page cover-page-display" aria-label={`${exam.title}の表紙`}>
                    <div className="exact-page-frame cover-page-frame">
                      <img className="exact-page-image" src={exam.coverImageUrl} alt={`${exam.title}の表紙`} />
                    </div>
                  </article>
                ) : (
                  <ProblemBooklet
                    answers={answers}
                    page={page}
                    questionsById={questionsById}
                    reviewMode={reviewMode}
                    onToggleAnswer={onToggleAnswer}
                  />
                )}
              </div>
            </div>
            {canGoNext ? (
              <button aria-label="次のページへ" className="booklet-side-arrow next" type="button" onClick={goNext}>
                ›
              </button>
            ) : null}
          </div>
        </div>
        <MarkSheet
          activePageId={showCover ? "" : page.id}
          answers={answers}
          exam={exam}
          reviewMode={reviewMode}
          onJumpToPage={(pageId) => {
            setShowCover(false);
            onChangePage(pageId);
          }}
          onToggleAnswer={onToggleAnswer}
        />
      </section>

      {showFinishConfirm ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="finish-dialog-title">
            <h2 id="finish-dialog-title">採点へ進みますか</h2>
            <p>試験一覧には戻らず、このまま採点を開始します。解答はこれ以上変更できません。</p>
            <div className="dialog-actions">
              <button className="secondary-button" type="button" onClick={() => setShowFinishConfirm(false)}>
                解答を続ける
              </button>
              <button
                className="danger-button finish-button"
                style={finishColorStyle}
                type="button"
                onClick={() => {
                  setShowFinishConfirm(false);
                  onFinish();
                }}
              >
                採点を開始
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
