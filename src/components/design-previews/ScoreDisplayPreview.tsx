import { useEffect, useMemo, useState } from "react";
import type { Exam, UserAnswers } from "../../types";
import { ExamRunner } from "../exam/ExamRunner";
import {
  ScoreDisplayCandidate,
  scoreDisplayCandidates,
  type ScoreDisplayVariant
} from "./ScoreDisplayCandidate";

interface ScoreDisplayPreviewProps {
  exam: Exam;
  onExit: () => void;
}

function createPreviewAnswers(exam: Exam): UserAnswers {
  return Object.fromEntries(
    exam.questions.map((question, index) => [question.id, index % 5 === 0 ? [] : [...question.correct]])
  );
}

export function ScoreDisplayPreview({ exam, onExit }: ScoreDisplayPreviewProps) {
  const [activeVariant, setActiveVariant] = useState<ScoreDisplayVariant>(scoreDisplayCandidates[0].id);
  const [currentPageId, setCurrentPageId] = useState(exam.pages[0]?.id ?? "");
  const answers = useMemo(() => createPreviewAnswers(exam), [exam]);

  useEffect(() => {
    setCurrentPageId(exam.pages[0]?.id ?? "");
  }, [exam]);

  return (
    <section className="score-display-design-mode" aria-label="得点表示デザイン候補">
      <div className="design-candidate-tabs score-display-candidate-tabs" role="tablist" aria-label="得点表示デザイン候補">
        {scoreDisplayCandidates.map((candidate) => (
          <button
            aria-controls="score-display-preview-panel"
            aria-selected={candidate.id === activeVariant}
            className="design-candidate-tab"
            id={`score-display-tab-${candidate.id}`}
            key={candidate.id}
            role="tab"
            type="button"
            onClick={() => setActiveVariant(candidate.id)}
          >
            <span>{candidate.name}</span>
            <small>{candidate.reference}</small>
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`score-display-tab-${activeVariant}`}
        className="score-display-preview-panel"
        id="score-display-preview-panel"
        role="tabpanel"
      >
        <ExamRunner
          answers={answers}
          className="score-display-preview-runner"
          currentPageId={currentPageId}
          deadline={null}
          exam={exam}
          reviewMode
          rootElement="div"
          onChangePage={setCurrentPageId}
          onExitReview={onExit}
          onExpire={() => undefined}
          onFinish={() => undefined}
          onToggleAnswer={() => undefined}
          renderReviewScore={(summary) => <ScoreDisplayCandidate summary={summary} variant={activeVariant} />}
        />
      </div>
    </section>
  );
}
