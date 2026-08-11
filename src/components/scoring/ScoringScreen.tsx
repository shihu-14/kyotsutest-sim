import { useEffect, useMemo, useState } from "react";
import type { Exam, GradeSummary, UserAnswers } from "../../types";
import { gradeExam } from "../../utils/answer";
import { ProblemBooklet } from "../exam/ProblemBooklet";
import { ScoringReviewBackdrop } from "./ScoringReviewBackdrop";

interface ScoringScreenProps {
  exam: Exam;
  answers: UserAnswers;
  startComplete?: boolean;
  onReview: () => void;
}

const coverPageIndex = -1;
const coverDelayMs = 1000;
const revealDelayMs = 420;
const pageTurnDelayMs = 760;
const emptyPageTurnDelayMs = 260;
const resultDelayMs = 620;
const autoReviewDelayMs = 2000;
const pauseOnScorePopForDebug = true;

export function ScoringScreen({ exam, answers, startComplete = false, onReview }: ScoringScreenProps) {
  const summary = useMemo<GradeSummary>(() => gradeExam(exam, answers), [answers, exam]);
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );
  const questionPageIds = useMemo(
    () => new Set(summary.gradedQuestions.map((item) => item.question.pageId)),
    [summary.gradedQuestions]
  );
  const firstPageIndex = exam.coverImageUrl ? coverPageIndex : 0;
  const [visibleCount, setVisibleCount] = useState(() => (startComplete ? summary.gradedQuestions.length : 0));
  const [currentPageIndex, setCurrentPageIndex] = useState(() => (startComplete ? exam.pages.length : firstPageIndex));
  const [showResult, setShowResult] = useState(startComplete);
  const visibleQuestions = useMemo(
    () => summary.gradedQuestions.slice(0, visibleCount),
    [summary.gradedQuestions, visibleCount]
  );
  const gradeStates = useMemo(
    () => new Map(visibleQuestions.map((item) => [item.question.id, item])),
    [visibleQuestions]
  );
  const displayPageIndex =
    currentPageIndex >= 0 ? Math.min(currentPageIndex, Math.max(0, exam.pages.length - 1)) : currentPageIndex;
  const displayPage = displayPageIndex >= 0 ? exam.pages[displayPageIndex] : undefined;
  const showCover = currentPageIndex === coverPageIndex && Boolean(exam.coverImageUrl);

  useEffect(() => {
    setVisibleCount(startComplete ? summary.gradedQuestions.length : 0);
    setCurrentPageIndex(startComplete ? exam.pages.length : firstPageIndex);
    setShowResult(startComplete);
  }, [exam.pages.length, firstPageIndex, startComplete, summary.gradedQuestions.length]);

  useEffect(() => {
    if (startComplete || showResult) {
      return undefined;
    }

    const currentPage = currentPageIndex >= 0 ? exam.pages[currentPageIndex] : undefined;
    const nextQuestion = summary.gradedQuestions[visibleCount];
    const isEmptyScoringPage = Boolean(currentPage && !questionPageIds.has(currentPage.id));
    const delay =
      currentPageIndex === coverPageIndex
        ? coverDelayMs
        : currentPageIndex >= exam.pages.length
          ? resultDelayMs
          : nextQuestion?.question.pageId === currentPage?.id
            ? revealDelayMs
            : isEmptyScoringPage
              ? emptyPageTurnDelayMs
              : pageTurnDelayMs;

    const timeoutId = window.setTimeout(() => {
      if (currentPageIndex === coverPageIndex) {
        setCurrentPageIndex(0);
        return;
      }

      if (currentPageIndex >= exam.pages.length) {
        setCurrentPageIndex(0);
        setShowResult(true);
        return;
      }

      if (nextQuestion && nextQuestion.question.pageId === currentPage?.id) {
        setVisibleCount((count) => Math.min(summary.gradedQuestions.length, count + 1));
        return;
      }

      setCurrentPageIndex((index) => index + 1);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [currentPageIndex, exam.pages, questionPageIds, showResult, startComplete, summary.gradedQuestions, visibleCount]);

  useEffect(() => {
    if (startComplete || !showResult || pauseOnScorePopForDebug) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onReview, autoReviewDelayMs);
    return () => window.clearTimeout(timeoutId);
  }, [onReview, showResult, startComplete]);

  const screenClassName = ["screen", "scoring-screen", startComplete ? "scoring-static" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={screenClassName}>
      {!showResult ? (
        <section className="scoring-booklet-scene" aria-label="問題用紙への採点">
          <div className="scoring-booklet-shell">
            <div className="scoring-page-turn" key={showCover ? "cover" : displayPage?.id ?? "done"}>
              {showCover ? (
                <article className="booklet-page exact-page cover-page-display" aria-label={`${exam.title}の表紙`}>
                  <div className="exact-page-frame cover-page-frame">
                    <img className="exact-page-image" src={exam.coverImageUrl} alt={`${exam.title}の表紙`} />
                  </div>
                </article>
              ) : displayPage ? (
                <ProblemBooklet
                  animateGradeStamps
                  answers={answers}
                  gradeStates={gradeStates}
                  page={displayPage}
                  questionsById={questionsById}
                  reviewMode={gradeStates.size > 0}
                  onToggleAnswer={() => undefined}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showResult && startComplete && exam.pages[0] ? (
        <ScoringReviewBackdrop
          answers={answers}
          exam={exam}
        />
      ) : null}

      {showResult ? (
        <section
          className={["scoring-final-result", "visible", startComplete ? "" : "auto-review-score-pop"]
            .filter(Boolean)
            .join(" ")}
          aria-label="採点結果"
          aria-live="polite"
        >
          <div
            className="scoring-final-content"
            style={
              pauseOnScorePopForDebug && !startComplete
                ? { animation: "scoring-score-pop-in 420ms cubic-bezier(0.2, 0.9, 0.25, 1.16) both" }
                : undefined
            }
          >
            <p>得点</p>
            <strong className="scoring-score-value">
              {summary.totalScore}
              <small>/{summary.totalPoints}</small>
            </strong>
          </div>
        </section>
      ) : null}
    </main>
  );
}
