import { useId, type CSSProperties } from "react";
import type {
  AnswerValue,
  CoverMarkArea,
  ExamPage,
  GradedQuestion,
  PageGradeAnchor,
  PageMarkArea,
  QuestionSlot,
  UserAnswers
} from "../../domain/exam";
import gradeCircleStamp from "./assets/grade-circle.png";
import gradeCrossStamp from "./assets/grade-cross.png";

interface CoverImageMarksProps {
  areas: CoverMarkArea[];
  selectedValues: Set<AnswerValue>;
  onToggle: (value: AnswerValue) => void;
}

export function CoverImageMarks({ areas, selectedValues, onToggle }: CoverImageMarksProps) {
  return (
    <div className="page-image-mark-layer" aria-label="表紙のマーク欄">
      {areas.map((area) => {
        const style = {
          "--mark-x": `${area.xPercent}%`,
          "--mark-y": `${area.yPercent}%`,
          "--mark-width": `${area.widthPercent ?? 3.2}%`,
          "--mark-height": `${area.heightPercent ?? 2.6}%`
        } as CSSProperties;

        return (
          <button
            aria-label={`表紙 ${area.label} ${area.value}`}
            aria-pressed={selectedValues.has(area.value)}
            className={["page-image-mark", selectedValues.has(area.value) ? "selected" : ""].filter(Boolean).join(" ")}
            key={area.id}
            style={style}
            type="button"
            onClick={() => onToggle(area.value)}
          />
        );
      })}
    </div>
  );
}

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

interface GradeStampProps {
  animate?: boolean;
  isCorrect: boolean;
}

function GradeStamp({ animate = false, isCorrect }: GradeStampProps) {
  const label = isCorrect ? "正解" : "不正解";
  const maskId = `grade-stamp-${useId().replaceAll(":", "")}`;
  const image = isCorrect ? gradeCircleStamp : gradeCrossStamp;
  const width = isCorrect ? 450 : 970;
  const height = isCorrect ? 332 : 1074;

  return (
    <span
      aria-label={label}
      className={["grade-stamp", "red-pen", isCorrect ? "circle" : "cross", animate ? "is-drawing" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <svg aria-hidden="true" className="stamp-drawing" focusable="false" viewBox={`0 0 ${width} ${height}`}>
        {animate ? (
          <defs>
            <mask height={height} id={maskId} maskUnits="userSpaceOnUse" width={width} x="0" y="0">
              {isCorrect ? (
                <path
                  className="stamp-reveal-stroke circle-reveal-stroke"
                  d="M218 280 C126 273 59 218 64 158 C70 80 140 31 226 34 C326 30 398 77 397 153 C397 199 374 232 340 254 C310 275 275 287 246 294"
                  pathLength="1"
                />
              ) : (
                <>
                  <path className="stamp-reveal-stroke cross-reveal-stroke first" d="M135 78 L905 826" pathLength="1" />
                  <path
                    className="stamp-reveal-stroke cross-reveal-stroke second"
                    d="M902 44 L60 1040"
                    pathLength="1"
                  />
                </>
              )}
            </mask>
          </defs>
        ) : null}
        <image
          className="stamp-asset"
          height={height}
          href={image}
          mask={animate ? `url(#${maskId})` : undefined}
          width={width}
        />
      </svg>
    </span>
  );
}

interface PageImageMarksProps {
  animateGradeStamps?: boolean;
  areas: PageMarkArea[];
  gradeAnchors: PageGradeAnchor[];
  questionsById: Map<string, QuestionSlot>;
  answers: UserAnswers;
  gradeStates?: Map<string, GradedQuestion>;
  reviewMode: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

function PageImageMarks({
  animateGradeStamps = false,
  areas,
  gradeAnchors,
  questionsById,
  answers,
  gradeStates,
  reviewMode,
  onToggleAnswer
}: PageImageMarksProps) {
  const visibleGradeAnchors = gradeAnchors.filter((anchor, index) => {
    if (!gradeStates?.has(anchor.questionId)) {
      return false;
    }

    return gradeAnchors.findIndex((candidate) => candidate.questionId === anchor.questionId) === index;
  });

  return (
    <div className="page-image-mark-layer" aria-label="問題ページ上のマーク領域">
      {areas.map((area) => {
        const question = questionsById.get(area.questionId);
        if (!question) {
          return null;
        }

        const selected = answers[question.id] ?? [];
        const checked = selected.includes(area.value);
        const gradeRevealed = !gradeStates || gradeStates.has(question.id);
        const correct = reviewMode && gradeRevealed && question.correct.includes(area.value);
        const option = question.options.find((candidate) => candidate.value === area.value);
        const widthPercent = area.widthPercent ?? 3.2;
        const heightPercent = area.heightPercent ?? 2.6;
        const style = {
          "--mark-x": `${area.xPercent}%`,
          "--mark-y": `${area.yPercent}%`,
          "--mark-width": `${widthPercent}%`,
          "--mark-height": `${heightPercent}%`
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
      {visibleGradeAnchors.map((anchor) => {
        const gradeState = gradeStates?.get(anchor.questionId);
        if (!gradeState) {
          return null;
        }

        const style = {
          "--grade-x": `${anchor.xPercent}%`,
          "--grade-y": `${anchor.yPercent}%`,
          "--grade-size": `${(anchor.widthPercent ?? 9.6) * 0.88}%`
        } as CSSProperties;

        return (
          <div className="page-image-grade-stamp" key={`${anchor.questionId}-grade`} style={style}>
            <GradeStamp animate={animateGradeStamps} isCorrect={gradeState.isCorrect} />
          </div>
        );
      })}
    </div>
  );
}
