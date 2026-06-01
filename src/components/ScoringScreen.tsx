import { useEffect, useMemo, useRef, useState } from "react";
import type { Exam, GradeSummary, UserAnswers } from "../types";
import { gradeExam } from "../utils/answer";

interface ScoringScreenProps {
  exam: Exam;
  answers: UserAnswers;
  startComplete?: boolean;
  onReview: () => void;
  onRestart: () => void;
}

export function ScoringScreen({ exam, answers, startComplete = false, onReview, onRestart }: ScoringScreenProps) {
  const summary = useMemo<GradeSummary>(() => gradeExam(exam, answers), [answers, exam]);
  const [visibleCount, setVisibleCount] = useState(() => (startComplete ? summary.gradedQuestions.length : 0));
  const rowRefs = useRef<Array<HTMLElement | null>>([]);
  const resultPanelRef = useRef<HTMLElement | null>(null);
  const isComplete = visibleCount >= summary.gradedQuestions.length;
  const visibleQuestions = summary.gradedQuestions.slice(0, visibleCount);
  const visibleScore = visibleQuestions.reduce((sum, item) => sum + item.earnedPoints, 0);

  useEffect(() => {
    setVisibleCount(startComplete ? summary.gradedQuestions.length : 0);
  }, [summary, startComplete]);

  useEffect(() => {
    if (visibleCount >= summary.gradedQuestions.length) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, visibleCount === 0 ? 420 : 300);

    return () => window.clearTimeout(timeoutId);
  }, [summary.gradedQuestions.length, visibleCount]);

  useEffect(() => {
    if (startComplete || visibleCount === 0) {
      return undefined;
    }

    const animationId = window.requestAnimationFrame(() => {
      const target = isComplete ? resultPanelRef.current : rowRefs.current[visibleCount - 1];
      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });

    return () => window.cancelAnimationFrame(animationId);
  }, [isComplete, startComplete, visibleCount]);

  return (
    <main className="screen scoring-screen">
      <header className="screen-heading">
        <div>
          <h1>採点</h1>
        </div>
      </header>

      <section className="scoring-layout" aria-label="採点結果">
        <section className="result-panel scoring-result-panel" aria-live="polite" ref={resultPanelRef}>
          <div>
            <p>{isComplete ? "最終得点" : "採点中"}</p>
            <strong>
              {isComplete ? summary.totalScore : visibleScore}
              <small>/{summary.totalPoints}</small>
            </strong>
          </div>
          {isComplete ? (
            <div className="result-actions scoring-result-actions">
              <button className="primary-button" type="button" onClick={onReview}>
                復習する
              </button>
              <button className="secondary-button" type="button" onClick={onRestart}>
                一覧へ戻る
              </button>
            </div>
          ) : null}
        </section>

        <section className="scoring-board" aria-label="採点項目">
          {summary.gradedQuestions.map((item, index) => {
            const isVisible = index < visibleCount;
            return (
              <article
                className={`grading-row ${isVisible ? "visible" : ""}`}
                key={item.question.id}
                ref={(element) => {
                  rowRefs.current[index] = element;
                }}
              >
                <div>
                  <span className="mark-label">{item.question.label}</span>
                  <strong>{item.question.section}</strong>
                  <p>{item.question.prompt.replaceAll("$", "")}</p>
                </div>
                <div className="grading-answer">
                  <span>解答 {item.userAnswer.length ? item.userAnswer.join(", ") : "-"}</span>
                  <span>正解 {item.correctAnswer.join(", ")}</span>
                </div>
                {isVisible ? (
                  <svg
                    aria-label={item.isCorrect ? "正解" : "不正解"}
                    className={`red-pen ${item.isCorrect ? "circle" : "cross"}`}
                    viewBox="0 0 80 80"
                  >
                    {item.isCorrect ? (
                      <circle cx="40" cy="40" r="25" />
                    ) : (
                      <>
                        <line className="cross-stroke first" x1="22" x2="58" y1="22" y2="58" />
                        <line className="cross-stroke second" x1="58" x2="22" y1="22" y2="58" />
                      </>
                    )}
                  </svg>
                ) : null}
                <strong className="earned-points">{isVisible ? `${item.earnedPoints}点` : ""}</strong>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
