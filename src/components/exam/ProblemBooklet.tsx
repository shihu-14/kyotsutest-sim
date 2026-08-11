import type { CSSProperties } from "react";
import type {
  AnswerValue,
  ExamPage,
  GradedQuestion,
  PageGradeAnchor,
  PageMarkArea,
  QuestionSlot,
  UserAnswers
} from "../../types";
import { normalizePreviewText, renderMathSegments, mathToHtml } from "../../utils/latex";
import { GradeStamp } from "./GradeStamp";
import { PageImageMarks } from "./PageImageMarks";

interface ProblemBookletProps {
  animateGradeStamps?: boolean;
  page: ExamPage;
  questionsById: Map<string, QuestionSlot>;
  answers: UserAnswers;
  gradeStates?: Map<string, GradedQuestion>;
  reviewMode?: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

export function ProblemBooklet({
  animateGradeStamps = false,
  page,
  questionsById,
  answers,
  gradeStates,
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
              animateGradeStamps={animateGradeStamps}
              areas={page.markAreas}
              answers={answers}
              gradeAnchors={page.gradeAnchors ?? []}
              gradeStates={gradeStates}
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
            animateGradeStamp={animateGradeStamps}
            gradeStatesActive={Boolean(gradeStates)}
            gradeState={gradeStates?.get(question.id)}
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
  animateGradeStamp: boolean;
  question: QuestionSlot;
  answers: AnswerValue[];
  gradeStatesActive: boolean;
  gradeState?: GradedQuestion;
  reviewMode: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

function QuestionBlock({
  animateGradeStamp,
  question,
  answers,
  gradeStatesActive,
  gradeState,
  reviewMode,
  onToggleAnswer
}: QuestionBlockProps) {
  const isCorrect =
    question.correct.length === answers.length && question.correct.every((value) => answers.includes(value));
  const isWrong = reviewMode && !isCorrect;

  return (
    <section className="question-block" aria-labelledby={`${question.id}-title`}>
      <h3 id={`${question.id}-title`}>
        <span className="question-grade-anchor">
          <span className="mark-label">{question.label}</span>
          {gradeState ? <GradeStamp animate={animateGradeStamp} isCorrect={gradeState.isCorrect} /> : null}
        </span>
        {renderMathSegments(normalizePreviewText(question.prompt))}
      </h3>
      <div className="choice-list" role={question.multi ? "group" : "radiogroup"} aria-label={`${question.label}の選択肢`}>
        {question.options.map((option) => {
          const selected = answers.includes(option.value);
          const isCorrectChoice = question.correct.includes(option.value);
          const showCorrectChoice =
            reviewMode &&
            isCorrectChoice &&
            (!gradeStatesActive || (gradeState ? !selected && !gradeState.isCorrect : false));
          const showWrongChoice =
            reviewMode &&
            selected &&
            !isCorrectChoice &&
            (!gradeStatesActive || (gradeState ? !gradeState.isCorrect : false));
          const classNames = [
            "choice-button",
            selected ? "selected" : "",
            showCorrectChoice ? "correct-choice" : "",
            showWrongChoice ? "wrong-choice" : ""
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
