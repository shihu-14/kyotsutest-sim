import { ExamToolbar } from "./ExamToolbar";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AnswerValue, Exam, QuestionSlot, UserAnswers } from "../../domain/exam";
import { gradeExam } from "../../domain/exam";
import { useBookletZoom } from "./useBookletZoom";
import { useBookletNavigation } from "./useBookletNavigation";
import { MarkSheet } from "./MarkSheet";
import { ProblemBooklet } from "./BookletPages";
import { CoverImageMarks } from "./BookletPages";
import { BookletSideArrow } from "./BookletNavigation";
import { PageNavigationTabs } from "./BookletNavigation";

interface ExamRunnerProps {
  exam: Exam;
  answers: UserAnswers;
  currentPageId: string;
  deadline: number | null;
  className?: string;
  reviewMode?: boolean;
  onChangePage: (pageId: string) => void;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
  onFinish: () => void;
  onExitReview?: () => void;
  onReturnHome?: () => void;
  onExpire: () => void;
}

export function ExamRunner({
  exam,
  answers,
  currentPageId,
  deadline,
  className,
  reviewMode = false,
  onChangePage,
  onToggleAnswer,
  onFinish,
  onExitReview,
  onReturnHome,
  onExpire
}: ExamRunnerProps) {
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
  } = useBookletNavigation(exam, currentPageId, onChangePage);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const reviewSummary = useMemo(() => (reviewMode ? gradeExam(exam, answers) : null), [answers, exam, reviewMode]);
  const reviewGradeStates = useMemo(
    () => (reviewSummary ? new Map(reviewSummary.gradedQuestions.map((item) => [item.question.id, item])) : undefined),
    [reviewSummary]
  );

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
    <main
      className={["exam-layout", "exam-mode-background", reviewMode ? "exam-review-mode" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={{ "--exam-timer-accent": "#ff4d00" } as CSSProperties}
    >
      <ExamToolbar
        reviewMode={reviewMode}
        reviewSummary={reviewSummary}
        deadline={deadline}
        durationMinutes={exam.durationMinutes}
        onExpire={onExpire}
        onFinish={onFinish}
        onExitReview={onExitReview}
        onReturnHome={onReturnHome}
      />

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
    </main>
  );
}
