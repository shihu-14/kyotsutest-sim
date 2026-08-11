import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AnswerValue, Exam, QuestionSlot, UserAnswers } from "../../types";
import { gradeExam } from "../../utils/answer";
import { useCountdown } from "../../hooks/useCountdown";
import { useBookletZoom } from "../../hooks/useBookletZoom";
import { useBookletNavigation } from "../../hooks/useBookletNavigation";
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
}

const timerAccentColor = "#ff4d00";
const homeActionColor = "#fffaf1";
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
  onExpire
}: ExamRunnerProps) {
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [coverMarks, setCoverMarks] = useState<Set<AnswerValue>>(() => new Set());
  const { bookletStageRef, bookletStyle, handleBookletKeyDown, handleBookletWheel } = useBookletZoom();
  const {
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    handlePageTabsWheel,
    jumpToPage,
    page,
    pageTabsRef,
    pageTabsStyle,
    selectCover,
    selectPage,
    showCover
  } = useBookletNavigation(exam, currentPageId, initialShowCover, onChangePage);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const reviewSummary = useMemo(() => (reviewMode ? gradeExam(exam, answers) : null), [answers, exam, reviewMode]);
  const reviewGradeStates = useMemo(
    () => (reviewSummary ? new Map(reviewSummary.gradedQuestions.map((item) => [item.question.id, item])) : undefined),
    [reviewSummary]
  );
  const countdown = useCountdown(reviewMode ? null : deadline, onExpire);
  const finishColorStyle = {
    "--finish-color": timerAccentColor,
    backgroundColor: timerAccentColor,
    color: "#ffffff"
  } as CSSProperties;
  const homeColorStyle = {
    "--home-action-color": homeActionColor,
    backgroundColor: homeActionColor
  } as CSSProperties;
  const examLayoutStyle = {
    "--exam-timer-accent": timerAccentColor
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
  const RootElement = rootElement;

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

  return (
    <RootElement
      className={["exam-layout", "exam-mode-background", reviewMode ? "exam-review-mode" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={examLayoutStyle}
    >
      <header className="exam-toolbar" aria-label="試験操作">
        <div className="toolbar-metrics">
          {reviewMode && reviewSummary ? <ReviewScoreBadge summary={reviewSummary} /> : null}
          {!reviewMode ? (
            <StopwatchTimer
              formatted={countdown.formatted}
              remainingMs={countdown.remainingMs}
              totalMs={totalTimeMs}
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
            onSelectCover={selectCover}
            onSelectPage={selectPage}
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
          onJumpToPage={jumpToPage}
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
