import { Fragment } from "react";
import type { AnswerValue, Exam, MarkOption, QuestionSlot, UserAnswers } from "../types";

interface MarkSheetProps {
  exam: Exam;
  answers: UserAnswers;
  activePageId: string;
  reviewMode?: boolean;
  onJumpToPage: (pageId: string) => void;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

const digitLabels = Array.from({ length: 10 }, (_item, index) => String(index));

function getMajorSection(section: string): string {
  return section.split(/\s+/)[0] || section;
}

function getOptionByLabel(question: QuestionSlot, label: string): MarkOption | undefined {
  return question.options.find((option) => option.label === label);
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
      <section className="answer-table" aria-label="解答欄">
        <div className="answer-title">解　答　欄</div>
        <div className="answer-grid" role="table">
          <div className="answer-grid-head answer-number-head" role="columnheader">
            解答番号
          </div>
          <div className="answer-grid-head answer-options-head" role="columnheader">
            {digitLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          {exam.questions.map((question, index) => {
            const selected = answers[question.id] ?? [];
            const isActive = question.pageId === activePageId;
            const section = getMajorSection(question.section);
            const startsSection = index === 0 || getMajorSection(exam.questions[index - 1].section) !== section;
            const isSectionActive = exam.questions.some(
              (candidate) => getMajorSection(candidate.section) === section && candidate.pageId === activePageId
            );

            return (
              <Fragment key={question.id}>
                {startsSection ? (
                  <div className="answer-section-row" role="row">
                    <button
                      className={`answer-section-button ${isSectionActive ? "active" : ""}`}
                      type="button"
                      onClick={() => onJumpToPage(question.pageId)}
                    >
                      {section}
                    </button>
                  </div>
                ) : null}
                <div className={`answer-grid-row ${isActive ? "active" : ""}`} role="row">
                  <button className="answer-number" type="button" onClick={() => onJumpToPage(question.pageId)}>
                    {question.label}
                  </button>
                  <div className="answer-options" role="cell">
                    {digitLabels.map((label) => {
                      const option = getOptionByLabel(question, label);
                      const checked = option ? selected.includes(option.value) : false;
                      const isCorrectChoice = option ? reviewMode && question.correct.includes(option.value) : false;

                      return (
                        <button
                          aria-label={`${question.label} ${label}`}
                          aria-pressed={checked}
                          className={[
                            "bubble",
                            checked ? "filled" : "",
                            option ? "" : "unavailable",
                            isCorrectChoice && !checked ? "review-correct" : ""
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          disabled={reviewMode || !option}
                          key={label}
                          type="button"
                          onClick={() => {
                            if (option) {
                              onToggleAnswer(question, option.value);
                            }
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
