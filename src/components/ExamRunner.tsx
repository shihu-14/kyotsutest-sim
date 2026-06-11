import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type WheelEvent } from "react";
import type { AnswerValue, CoverMarkArea, Exam, QuestionSlot, UserAnswers } from "../types";
import { gradeExam } from "../utils/answer";
import { useCountdown } from "../hooks/useCountdown";
import { MarkSheet } from "./MarkSheet";
import { ProblemBooklet } from "./ProblemBooklet";
import { ReviewScoreBadge } from "./ReviewScoreBadge";
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
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [coverMarks, setCoverMarks] = useState<Set<AnswerValue>>(() => new Set());
  const bookletStageRef = useRef<HTMLDivElement | null>(null);
  const pageTabsRef = useRef<HTMLDivElement | null>(null);
  const pageNavigationSourceRef = useRef<"arrow" | "tab" | null>(null);
  const previousPagePositionRef = useRef<number | null>(null);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const reviewSummary = useMemo(() => (reviewMode ? gradeExam(exam, answers) : null), [answers, exam, reviewMode]);
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
    backgroundColor: homeActionColor
  } as CSSProperties;
  const exitDialogStyle = {
    width: "min(550px, calc(100vw - 40px))"
  } as CSSProperties;
  const exitDialogCopyStyle = {
    whiteSpace: "nowrap"
  } as CSSProperties;
  const exitDialogActionsStyle = {
    gap: "16px"
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

  const toggleCoverMark = (value: AnswerValue) => {
    setCoverMarks((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  useEffect(() => {
    setCoverMarks(new Set());
  }, [exam.id]);

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
          {reviewMode && reviewSummary ? <ReviewScoreBadge summary={reviewSummary} /> : null}
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
            <button
              className="secondary-button home-return-button"
              style={homeColorStyle}
              type="button"
              onClick={onExitReview}
            >
              ホームに戻る
            </button>
          ) : (
            <div className="finish-action-stack">
              {onReturnHome ? (
                <button
                  className="secondary-button home-return-button"
                  style={homeColorStyle}
                  type="button"
                  onClick={() => setShowHomeConfirm(true)}
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
                      {exam.coverMarkAreas?.length ? (
                        <CoverImageMarks
                          areas={exam.coverMarkAreas}
                          selectedValues={coverMarks}
                          onToggle={toggleCoverMark}
                        />
                      ) : null}
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
        <div className="dialog-backdrop" role="presentation" onClick={() => setShowFinishConfirm(false)}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="採点へ進む確認"
            style={exitDialogStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <p style={exitDialogCopyStyle}>残り時間がありますが，解答を終了し採点へ進みますか</p>
            <div className="dialog-actions" style={exitDialogActionsStyle}>
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
                採点へ進む
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {showHomeConfirm ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setShowHomeConfirm(false)}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="ホームに戻る確認"
            style={exitDialogStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <p style={exitDialogCopyStyle}>試験を中断してホームへ戻りますか（現在の解答は保存されません）</p>
            <div className="dialog-actions" style={exitDialogActionsStyle}>
              <button className="secondary-button" type="button" onClick={() => setShowHomeConfirm(false)}>
                解答を続ける
              </button>
              <button
                className="danger-button finish-button"
                style={finishColorStyle}
                type="button"
                onClick={() => {
                  setShowHomeConfirm(false);
                  onReturnHome?.();
                }}
              >
                ホームに戻る
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

interface CoverImageMarksProps {
  areas: CoverMarkArea[];
  selectedValues: Set<AnswerValue>;
  onToggle: (value: AnswerValue) => void;
}

function CoverImageMarks({ areas, selectedValues, onToggle }: CoverImageMarksProps) {
  return (
    <div className="page-image-mark-layer" aria-label="表紙のマーク欄">
      {areas.map((area) => {
        const style = {
          "--mark-x": `${area.xPercent}%`,
          "--mark-y": `${area.yPercent}%`,
          "--mark-width": `${area.widthPercent ?? 3.2}%`,
          "--mark-height": `${area.heightPercent ?? 2.6}%`
        } as CSSProperties;

        return (
          <button
            aria-label={`表紙 ${area.label} ${area.value}`}
            aria-pressed={selectedValues.has(area.value)}
            className={["page-image-mark", selectedValues.has(area.value) ? "selected" : ""].filter(Boolean).join(" ")}
            key={area.id}
            style={style}
            type="button"
            onClick={() => onToggle(area.value)}
          />
        );
      })}
    </div>
  );
}
