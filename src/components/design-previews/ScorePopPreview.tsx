import { useState } from "react";
import { ScorePop, scorePopCandidates, type ScorePopVariant } from "./ScorePop";

const previewScore = 86;
const previewTotalPoints = 100;

export function ScorePopPreview() {
  const [activeVariant, setActiveVariant] = useState<ScorePopVariant>(scorePopCandidates[0].id);
  const [replayKey, setReplayKey] = useState(0);
  const activeCandidate = scorePopCandidates.find((candidate) => candidate.id === activeVariant) ?? scorePopCandidates[0];

  const selectCandidate = (variant: ScorePopVariant) => {
    setActiveVariant(variant);
    setReplayKey((current) => current + 1);
  };

  return (
    <section className="score-pop-design-mode" aria-label="得点ポップデザイン候補">
      <div className="design-candidate-tabs score-pop-candidate-tabs" role="tablist" aria-label="得点ポップデザイン候補">
        {scorePopCandidates.map((candidate) => (
          <button
            aria-controls="score-pop-preview-panel"
            aria-selected={candidate.id === activeVariant}
            className="design-candidate-tab"
            id={`score-pop-tab-${candidate.id}`}
            key={candidate.id}
            role="tab"
            type="button"
            onClick={() => selectCandidate(candidate.id)}
          >
            <span>{candidate.name}</span>
            <small>{candidate.reference}</small>
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`score-pop-tab-${activeVariant}`}
        className="score-pop-preview-panel"
        id="score-pop-preview-panel"
        role="tabpanel"
      >
        <div className="score-pop-preview-toolbar">
          <p>サンプル得点 86 / 100</p>
          <button
            className="secondary-button score-pop-replay-button"
            type="button"
            onClick={() => setReplayKey((current) => current + 1)}
          >
            {activeCandidate.name}を再生
          </button>
        </div>
        <div className="score-pop-preview-stage" aria-label="得点ポップ再生エリア">
          <div className="score-pop-preview-paper" aria-hidden="true" />
          <div className="score-pop-preview-position">
            <ScorePop
              key={`${activeVariant}-${replayKey}`}
              score={previewScore}
              totalPoints={previewTotalPoints}
              variant={activeVariant}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
