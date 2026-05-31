import type { CSSProperties } from "react";
import type { AnswerValue, ExamPage, PageMarkArea, QuestionSlot, UserAnswers } from "../types";
import { normalizePreviewText, renderMathSegments, mathToHtml } from "../utils/latex";

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
    return (
      <article className="booklet-page exact-page" aria-label={`${page.title}の問題冊子`}>
        <div className="exact-page-frame">
          <img className="exact-page-image" src={page.pageImageUrl} alt={page.pageImageAlt ?? page.title} />
          {page.markAreas?.length ? (
            <PageImageMarks
              areas={page.markAreas}
              answers={answers}
              questionsById={questionsById}
              reviewMode={reviewMode}
              onToggleAnswer={onToggleAnswer}
            />
          ) : null}
        </div>
      </article>
    );
  }

  const pageStyle = {
    "--booklet-page-color": page.layout?.pageColor,
    "--booklet-line-height": page.layout?.lineHeight,
    "--booklet-padding-top": page.layout?.paddingTop,
    "--booklet-padding-right": page.layout?.paddingRight,
    "--booklet-padding-bottom": page.layout?.paddingBottom,
    "--booklet-padding-left": page.layout?.paddingLeft
  } as CSSProperties;

  return (
    <article className="booklet-page" aria-label={`${page.title}の問題冊子`} style={pageStyle}>
      <div className="page-number">-{page.pageNumber}-</div>
      {page.blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 3 ? "h3" : "h2";
          return <Heading key={`${block.type}-${index}`}>{block.text}</Heading>;
        }

        if (block.type === "paragraph") {
          return <p key={`${block.type}-${index}`}>{renderMathSegments(normalizePreviewText(block.text))}</p>;
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
          const imageStyle = block.imageStyle ? (block.imageStyle as CSSProperties) : undefined;
          return (
            <figure className="problem-figure" key={`${block.type}-${index}`}>
              {block.imageUrl ? <img src={block.imageUrl} alt={block.alt} style={imageStyle} /> : null}
              {block.tikz ? <pre>{block.tikz}</pre> : null}
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "note") {
          return (
            <aside className="booklet-note" key={`${block.type}-${index}`}>
              {renderMathSegments(normalizePreviewText(block.text))}
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

interface PageImageMarksProps {
  areas: PageMarkArea[];
  questionsById: Map<string, QuestionSlot>;
  answers: UserAnswers;
  reviewMode: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

function PageImageMarks({ areas, questionsById, answers, reviewMode, onToggleAnswer }: PageImageMarksProps) {
  return (
    <div className="page-image-mark-layer" aria-label="問題ページ上のマーク領域">
      {areas.map((area) => {
        const question = questionsById.get(area.questionId);
        if (!question) {
          return null;
        }

        const selected = answers[question.id] ?? [];
        const checked = selected.includes(area.value);
        const correct = reviewMode && !checked && question.correct.includes(area.value);
        const option = question.options.find((candidate) => candidate.value === area.value);
        const style = {
          "--mark-x": `${area.xPercent}%`,
          "--mark-y": `${area.yPercent}%`,
          "--mark-width": `${area.widthPercent ?? 3.2}%`,
          "--mark-height": `${area.heightPercent ?? 2.6}%`
        } as CSSProperties;

        return (
          <button
            aria-label={`${question.label} ${option?.label ?? area.value}`}
            aria-pressed={checked}
            className={["page-image-mark", checked ? "selected" : "", correct ? "review-correct" : ""]
              .filter(Boolean)
              .join(" ")}
            disabled={reviewMode}
            key={`${area.questionId}-${area.value}-${area.xPercent}-${area.yPercent}`}
            style={style}
            type="button"
            onClick={() => onToggleAnswer(question, area.value)}
          />
        );
      })}
    </div>
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
        {renderMathSegments(normalizePreviewText(question.prompt))}
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
              <span>{renderMathSegments(normalizePreviewText(option.content))}</span>
            </button>
          );
        })}
      </div>
      {reviewMode && isWrong ? (
        <p className="explanation">
          <strong>解説</strong>
          {renderMathSegments(normalizePreviewText(question.explanation))}
        </p>
      ) : null}
    </section>
  );
}
