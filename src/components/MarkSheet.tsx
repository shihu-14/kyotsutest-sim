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

function getSubjectTabs(subject: string): string[] {
  if (subject.includes("数学I・A")) {
    return ["数学I", "数学A"];
  }

  return subject
    .split(/[・/]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
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
  const subjectTabs = getSubjectTabs(exam.subject);
  const sections = Array.from(new Map(exam.questions.map((question) => [question.section, question])).values());

  return (
    <aside className="mark-sheet" aria-label="デジタルマークシート">
      <div className="sheet-window-bar" aria-hidden="true">
        <span>←</span>
        <span>→</span>
        <i />
      </div>

      <section className="subject-sheet">
        <h2>解 答 科 目 欄</h2>
        <p>下の解答欄に解答する科目をマークしなさい。</p>
        <div className="subject-tabs" aria-label="解答科目">
          {subjectTabs.map((subject, index) => (
            <span className={index === 0 ? "active" : ""} key={subject}>
              {subject}
            </span>
          ))}
        </div>
      </section>

      <nav className="major-tabs" aria-label="大問">
        {sections.map((question, index) => (
          <button
            className={question.pageId === activePageId ? "active" : ""}
            key={question.section}
            type="button"
            onClick={() => onJumpToPage(question.pageId)}
          >
            {index + 1}
          </button>
        ))}
      </nav>

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

          {exam.questions.map((question) => {
            const selected = answers[question.id] ?? [];
            const isActive = question.pageId === activePageId;
            const isIncorrectReview =
              reviewMode &&
              (selected.length !== question.correct.length ||
                question.correct.some((value) => !selected.includes(value)));

            return (
              <div className={`answer-grid-row ${isActive ? "active" : ""}`} key={question.id} role="row">
                <button
                  className="answer-number"
                  type="button"
                  onClick={() => onJumpToPage(question.pageId)}
                >
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
                          isCorrectChoice ? "review-correct" : "",
                          isIncorrectReview && checked && !isCorrectChoice ? "review-wrong" : ""
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
            );
          })}
        </div>
      </section>
    </aside>
  );
}
