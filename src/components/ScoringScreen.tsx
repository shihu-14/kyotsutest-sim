import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Exam, GradeSummary, UserAnswers } from "../types";
import { gradeExam } from "../utils/answer";
import { MarkSheet } from "./MarkSheet";
import { ProblemBooklet } from "./ProblemBooklet";
import { ReviewScoreBadge } from "./ReviewScoreBadge";

interface ScoringScreenProps {
  exam: Exam;
  answers: UserAnswers;
  startComplete?: boolean;
  onReview: () => void;
  onRestart: () => void;
}

const coverPageIndex = -1;
const coverDelayMs = 1000;
const revealDelayMs = 420;
const pageTurnDelayMs = 760;
const emptyPageTurnDelayMs = 260;
const resultDelayMs = 620;

export function ScoringScreen({ exam, answers, startComplete = false, onReview, onRestart }: ScoringScreenProps) {
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
  const reviewDisplayPage = displayPage ?? exam.pages[0];
  const showCover = currentPageIndex === coverPageIndex && Boolean(exam.coverImageUrl);
  const isBookletComplete = currentPageIndex >= exam.pages.length;

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

  const screenClassName = ["screen", "scoring-screen", startComplete ? "scoring-static" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={screenClassName}>
      <h1 className="scoring-heading">採点</h1>

      {!showResult ? (
        <section
          className={`scoring-booklet-scene ${isBookletComplete ? "fade-out" : ""}`}
          aria-label="問題用紙への採点"
        >
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

      {showResult && reviewDisplayPage ? (
        <ScoringReviewBackdrop
          answers={answers}
          exam={exam}
          page={reviewDisplayPage}
          questionsById={questionsById}
          startComplete={startComplete}
          summary={summary}
        />
      ) : null}

      {showResult ? (
        <section className="scoring-final-result visible" aria-label="採点結果" aria-live="polite">
          <div className="scoring-final-content">
            <p>最終得点</p>
            <strong className="scoring-score-value">
              {summary.totalScore}
              <small>/{summary.totalPoints}</small>
            </strong>
            <div className={["result-actions", startComplete ? "" : "scoring-result-actions"].filter(Boolean).join(" ")}>
              <button className="primary-button" type="button" onClick={onReview}>
                復習する
              </button>
              <button className="secondary-button" type="button" onClick={onRestart}>
                ホームに戻る
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

interface ScoringReviewBackdropProps {
  exam: Exam;
  answers: UserAnswers;
  page: Exam["pages"][number];
  questionsById: Map<string, Exam["questions"][number]>;
  startComplete: boolean;
  summary: GradeSummary;
}

function ScoringReviewBackdrop({
  exam,
  answers,
  page,
  questionsById,
  startComplete,
  summary
}: ScoringReviewBackdropProps) {
  const gradeStates = useMemo(
    () => new Map(summary.gradedQuestions.map((item) => [item.question.id, item])),
    [summary.gradedQuestions]
  );
  const pageTabsStyle = {
    "--visible-page-tabs": String(Math.min(exam.pages.length, 12)),
    "--has-cover-tab": exam.coverImageUrl ? "1" : "0"
  } as CSSProperties;

  return (
    <section
      className={["scoring-review-backdrop", startComplete ? "static" : ""].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <div className="exam-layout exam-mode-background scoring-review-layout">
        <header className="exam-toolbar">
          <div className="toolbar-metrics">
            <ReviewScoreBadge summary={summary} />
          </div>
        </header>
        <section className="exam-body">
          <div className="booklet-shell">
            <nav className="page-tabs" style={pageTabsStyle}>
              {exam.coverImageUrl ? (
                <span className="cover-tab">表紙</span>
              ) : null}
              <div className="page-tab-scroll">
                {exam.pages.map((item) => (
                  <span className={item.id === page.id ? "active" : ""} key={item.id}>
                    {item.pageNumber}
                  </span>
                ))}
              </div>
            </nav>
            <div className="booklet-stage-shell">
              <div className="booklet-stage">
                <div className="booklet-scroll-surface exact-scroll-surface">
                  <ProblemBooklet
                    answers={answers}
                    gradeStates={gradeStates}
                    page={page}
                    questionsById={questionsById}
                    reviewMode
                    onToggleAnswer={() => undefined}
                  />
                </div>
              </div>
            </div>
          </div>
          <MarkSheet
            activePageId={page.id}
            answers={answers}
            exam={exam}
            reviewMode
            onJumpToPage={() => undefined}
            onToggleAnswer={() => undefined}
          />
        </section>
      </div>
    </section>
  );
}
