import type { CSSProperties } from "react";
import type { AnswerValue, GradedQuestion, PageGradeAnchor, PageMarkArea, QuestionSlot, UserAnswers } from "../../types";
import { GradeStamp } from "./GradeStamp";

interface PageImageMarksProps {
  areas: PageMarkArea[];
  gradeAnchors: PageGradeAnchor[];
  questionsById: Map<string, QuestionSlot>;
  answers: UserAnswers;
  gradeStates?: Map<string, GradedQuestion>;
  reviewMode: boolean;
  onToggleAnswer: (question: QuestionSlot, value: AnswerValue) => void;
}

export function PageImageMarks({
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
        const correct = reviewMode && question.correct.includes(area.value);
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
            <GradeStamp isCorrect={gradeState.isCorrect} />
          </div>
        );
      })}
    </div>
  );
}
