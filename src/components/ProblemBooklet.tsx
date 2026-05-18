import type { AnswerValue, ExamPage, QuestionSlot, UserAnswers } from "../types";
import { renderMathSegments, mathToHtml } from "../utils/latex";

interface ProblemBookletProps {
  page: ExamPage;
  questionsById: Map<string, QuestionSlot>;
  answers: UserAnswers;
  reviewMode?: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

export function ProblemBooklet({
  page,
  questionsById,
  answers,
  reviewMode = false,
  onToggleAnswer
}: ProblemBookletProps) {
  if (page.pageImageUrl) {
    const pageQuestions = Array.from(questionsById.values()).filter((question) => question.pageId === page.id);

    return (
      <article className="booklet-page exact-page" aria-label={`${page.title}の問題冊子`}>
        <img className="exact-page-image" src={page.pageImageUrl} alt={page.pageImageAlt ?? page.title} />
        {pageQuestions.length ? (
          <PageMarkPanel
            answers={answers}
            questions={pageQuestions}
            reviewMode={reviewMode}
            onToggleAnswer={onToggleAnswer}
          />
        ) : null}
      </article>
    );
  }

  return (
    <article className="booklet-page" aria-label={`${page.title}の問題冊子`}>
      <div className="page-number">-{page.pageNumber}-</div>
      {page.blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 3 ? "h3" : "h2";
          return <Heading key={`${block.type}-${index}`}>{block.text}</Heading>;
        }

        if (block.type === "paragraph") {
          return <p key={`${block.type}-${index}`}>{renderMathSegments(block.text)}</p>;
        }

        if (block.type === "formula") {
          return (
            <div
              className="formula-block"
              dangerouslySetInnerHTML={{ __html: mathToHtml(block.latex, true) }}
              key={`${block.type}-${index}`}
            />
          );
        }

        if (block.type === "figure") {
          return (
            <figure className="problem-figure" key={`${block.type}-${index}`}>
              {block.imageUrl ? <img src={block.imageUrl} alt={block.alt} /> : null}
              {block.tikz ? <pre>{block.tikz}</pre> : null}
              <figcaption>{block.caption}</figcaption>
            </figure>
          );
        }

        if (block.type === "note") {
          return (
            <aside className="booklet-note" key={`${block.type}-${index}`}>
              {renderMathSegments(block.text)}
            </aside>
          );
        }

        const question = questionsById.get(block.questionId);
        if (!question) {
          return null;
        }

        return (
          <QuestionBlock
            answers={answers[question.id] ?? []}
            key={question.id}
            question={question}
            reviewMode={reviewMode}
            onToggleAnswer={onToggleAnswer}
          />
        );
      })}
    </article>
  );
}

interface QuestionBlockProps {
  question: QuestionSlot;
  answers: AnswerValue[];
  reviewMode: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

function QuestionBlock({ question, answers, reviewMode, onToggleAnswer }: QuestionBlockProps) {
  const isCorrect =
    question.correct.length === answers.length && question.correct.every((value) => answers.includes(value));
  const isWrong = reviewMode && !isCorrect;

  return (
    <section className={`question-block ${isWrong ? "review-incorrect" : ""}`} aria-labelledby={`${question.id}-title`}>
      <h3 id={`${question.id}-title`}>
        <span className="mark-label">{question.label}</span>
        {renderMathSegments(question.prompt)}
      </h3>
      <div className="choice-list" role={question.multi ? "group" : "radiogroup"} aria-label={`${question.label}の選択肢`}>
        {question.options.map((option) => {
          const selected = answers.includes(option.value);
          const isCorrectChoice = question.correct.includes(option.value);
          const classNames = [
            "choice-button",
            selected ? "selected" : "",
            reviewMode && isCorrectChoice ? "correct-choice" : "",
            reviewMode && selected && !isCorrectChoice ? "wrong-choice" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              aria-pressed={selected}
              className={classNames}
              disabled={reviewMode}
              key={option.value}
              type="button"
              onClick={() => onToggleAnswer(question, option.value)}
            >
              <span className="choice-index">{option.label}</span>
              <span>{renderMathSegments(option.content)}</span>
            </button>
          );
        })}
      </div>
      {reviewMode && isWrong ? (
        <p className="explanation">
          <strong>解説</strong>
          {renderMathSegments(question.explanation)}
        </p>
      ) : null}
    </section>
  );
}

interface PageMarkPanelProps {
  questions: QuestionSlot[];
  answers: UserAnswers;
  reviewMode: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

function PageMarkPanel({ questions, answers, reviewMode, onToggleAnswer }: PageMarkPanelProps) {
  return (
    <div className="page-mark-panel" aria-label="問題ページ内の解答マーク">
      {questions.map((question) => {
        const selected = answers[question.id] ?? [];
        const isWrong =
          reviewMode &&
          (selected.length !== question.correct.length ||
            question.correct.some((value) => !selected.includes(value)));

        return (
          <div className={`page-mark-row ${isWrong ? "review-incorrect" : ""}`} key={question.id}>
            <span className="page-mark-label">{question.label}</span>
            <div className="page-mark-options">
              {question.options.map((option) => {
                const checked = selected.includes(option.value);
                const correct = reviewMode && question.correct.includes(option.value);

                return (
                  <button
                    aria-label={`${question.label} ${option.label}`}
                    aria-pressed={checked}
                    className={[
                      "page-mark-bubble",
                      checked ? "filled" : "",
                      correct ? "review-correct" : "",
                      isWrong && checked && !correct ? "review-wrong" : ""
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
          </div>
        );
      })}
    </div>
  );
}
