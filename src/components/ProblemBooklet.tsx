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
    <section className="question-block" aria-labelledby={`${question.id}-title`}>
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
