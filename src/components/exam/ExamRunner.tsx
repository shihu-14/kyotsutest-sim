import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type WheelEvent } from "react";
import type { AnswerValue, Exam, GradeSummary, QuestionSlot, UserAnswers } from "../../types";
import { gradeExam } from "../../utils/answer";
import { useCountdown } from "../../hooks/useCountdown";
import { useBookletZoom } from "../../hooks/useBookletZoom";
import { MarkSheet } from "./MarkSheet";
import { ProblemBooklet } from "./ProblemBooklet";
import { ReviewScoreBadge } from "./ReviewScoreBadge";
import { StopwatchTimer } from "./StopwatchTimer";
import { CoverImageMarks } from "./CoverImageMarks";
import { BookletSideArrow } from "./BookletSideArrow";
import { ExamConfirmDialog } from "./ExamConfirmDialog";
import { PageNavigationTabs } from "./PageNavigationTabs";

interface ExamRunnerProps {
  exam: Exam;
  answers: UserAnswers;
  currentPageId: string;
  deadline: number | null;
  initialShowCover?: boolean;
  className?: string;
  reviewMode?: boolean;
  rootElement?: "main" | "div";
  onChangePage: (pageId: string) => void;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
  onFinish: () => void;
  onExitReview?: () => void;
  onReturnHome?: () => void;
  onExpire: () => void;
  renderReviewScore?: (summary: GradeSummary) => ReactNode;
}

const timerAccentColor = "#ff4d00";
const homeActionColor = "#fffaf1";
const visiblePageTabCount = 12;

export function ExamRunner({
  exam,
  answers,
  currentPageId,
  deadline,
  initialShowCover = false,
  className,
  reviewMode = false,
  rootElement = "main",
  onChangePage,
  onToggleAnswer,
  onFinish,
  onExitReview,
  onReturnHome,
  onExpire,
  renderReviewScore
}: ExamRunnerProps) {
  const [showCover, setShowCover] = useState(() => initialShowCover && Boolean(exam.coverImageUrl));
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [coverMarks, setCoverMarks] = useState<Set<AnswerValue>>(() => new Set());
  const { bookletStageRef, bookletStyle, handleBookletKeyDown, handleBookletWheel } = useBookletZoom();
  const pageTabsRef = useRef<HTMLDivElement | null>(null);
  const pageNavigationSourceRef = useRef<"arrow" | "tab" | null>(null);
  const previousPagePositionRef = useRef<number | null>(null);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const reviewSummary = useMemo(() => (reviewMode ? gradeExam(exam, answers) : null), [answers, exam, reviewMode]);
  const reviewGradeStates = useMemo(
    () => (reviewSummary ? new Map(reviewSummary.gradedQuestions.map((item) => [item.question.id, item])) : undefined),
    [reviewSummary]
  );
  const page = exam.pages.find((candidate) => candidate.id === currentPageId) ?? exam.pages[0];
  const pageIndex = exam.pages.findIndex((candidate) => candidate.id === page.id);
  const countdown = useCountdown(reviewMode ? null : deadline, onExpire);
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
  const RootElement = rootElement;

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

  const toggleCoverMark = (value: AnswerValue) => {
    setCoverMarks((current) => {
      if (current.has(value)) {
        return new Set();
      }

      return new Set([value]);
    });
  };

  useEffect(() => {
    setCoverMarks(new Set());
  }, [exam.id]);

  useEffect(() => {
    setShowCover(initialShowCover && Boolean(exam.coverImageUrl));
  }, [exam.coverImageUrl, exam.id, initialShowCover]);

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

  const handlePageTabsWheel = (event: WheelEvent<HTMLElement>) => {
    const nav = pageTabsRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }

    event.preventDefault();
    nav.scrollLeft += event.deltaY;
  };

  return (
    <RootElement className={["exam-layout", "exam-mode-background", className].filter(Boolean).join(" ")}>
      <header className="exam-toolbar" aria-label="試験操作">
        <div className="toolbar-metrics">
          {reviewMode && reviewSummary
            ? renderReviewScore?.(reviewSummary) ?? <ReviewScoreBadge summary={reviewSummary} />
            : null}
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
          <PageNavigationTabs
            exam={exam}
            page={page}
            scrollRef={pageTabsRef}
            showCover={showCover}
            style={pageTabsStyle}
            onPageTabsWheel={handlePageTabsWheel}
            onSelectCover={() => setShowCover(true)}
            onSelectPage={(pageId) => {
              pageNavigationSourceRef.current = "tab";
              setShowCover(false);
              onChangePage(pageId);
            }}
          />
          <div className="booklet-stage-shell">
            {canGoPrevious ? <BookletSideArrow direction="previous" onClick={goPrevious} /> : null}
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
                    gradeStates={reviewGradeStates}
                    page={page}
                    questionsById={questionsById}
                    reviewMode={reviewMode}
                    onToggleAnswer={onToggleAnswer}
                  />
                )}
              </div>
            </div>
            {canGoNext ? <BookletSideArrow direction="next" onClick={goNext} /> : null}
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
        <ExamConfirmDialog
          actionsStyle={exitDialogActionsStyle}
          ariaLabel="採点へ進む確認"
          confirmStyle={finishColorStyle}
          confirmText="採点へ進む"
          copy="残り時間がありますが，解答を終了し採点へ進みますか"
          copyStyle={exitDialogCopyStyle}
          dialogStyle={exitDialogStyle}
          onCancel={() => setShowFinishConfirm(false)}
          onConfirm={() => {
            setShowFinishConfirm(false);
            onFinish();
          }}
        />
      ) : null}
      {showHomeConfirm ? (
        <ExamConfirmDialog
          actionsStyle={exitDialogActionsStyle}
          ariaLabel="ホームに戻る確認"
          confirmStyle={finishColorStyle}
          confirmText="ホームに戻る"
          copy="試験を中断してホームへ戻りますか（現在の解答は保存されません）"
          copyStyle={exitDialogCopyStyle}
          dialogStyle={exitDialogStyle}
          onCancel={() => setShowHomeConfirm(false)}
          onConfirm={() => {
            setShowHomeConfirm(false);
            onReturnHome?.();
          }}
        />
      ) : null}
    </RootElement>
  );
}
