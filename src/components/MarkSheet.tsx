import type { AnswerValue, Exam, QuestionSlot, UserAnswers } from "../types";

interface MarkSheetProps {
  exam: Exam;
  answers: UserAnswers;
  activePageId: string;
  reviewMode?: boolean;
  onJumpToPage: (pageId: string) => void;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

export function MarkSheet({
  exam,
  answers,
  activePageId,
  reviewMode = false,
  onJumpToPage,
  onToggleAnswer
}: MarkSheetProps) {
  return (
    <aside className="mark-sheet" aria-label="デジタルマークシート">
      <header>
        <p className="eyebrow">Answer sheet</p>
        <h2>マークシート</h2>
      </header>
      <div className="sheet-rows">
        {exam.questions.map((question) => {
          const selected = answers[question.id] ?? [];
          const isActive = question.pageId === activePageId;
          const isIncorrectReview =
            reviewMode &&
            (selected.length !== question.correct.length ||
              question.correct.some((value) => !selected.includes(value)));

          return (
            <section className="sheet-row" key={question.id} aria-label={`${question.label}の解答欄`}>
              <button
                className={`sheet-jump ${isActive ? "active" : ""}`}
                type="button"
                onClick={() => onJumpToPage(question.pageId)}
              >
                {question.label}
              </button>
              <div className="sheet-options">
                {question.options.map((option) => {
                  const checked = selected.includes(option.value);
                  const isCorrectChoice = reviewMode && question.correct.includes(option.value);

                  return (
                    <button
                      aria-label={`${question.label} ${option.label}`}
                      aria-pressed={checked}
                      className={[
                        "bubble",
                        checked ? "filled" : "",
                        isCorrectChoice ? "review-correct" : "",
                        isIncorrectReview && checked && !isCorrectChoice ? "review-wrong" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={reviewMode}
                      key={option.value}
                      type="button"
                      onClick={() => onToggleAnswer(question, option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
