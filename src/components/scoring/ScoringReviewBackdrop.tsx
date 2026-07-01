import type { Exam, UserAnswers } from "../../types";
import { ExamRunner } from "../exam/ExamRunner";

interface ScoringReviewBackdropProps {
  exam: Exam;
  answers: UserAnswers;
  startComplete: boolean;
}

export function ScoringReviewBackdrop({ exam, answers, startComplete }: ScoringReviewBackdropProps) {
  return (
    <section
      className={["scoring-review-backdrop", startComplete ? "static" : ""].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <ExamRunner
        answers={answers}
        currentPageId={exam.pages[0]?.id ?? ""}
        deadline={null}
        exam={exam}
        reviewMode
        rootElement="div"
        onChangePage={() => undefined}
        onExitReview={() => undefined}
        onExpire={() => undefined}
        onFinish={() => undefined}
        onToggleAnswer={() => undefined}
      />
    </section>
  );
}
