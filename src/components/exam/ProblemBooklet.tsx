import type { AnswerValue, ExamPage, GradedQuestion, QuestionSlot, UserAnswers } from "../../types";
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
