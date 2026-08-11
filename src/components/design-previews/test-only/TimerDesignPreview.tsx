import { useState } from "react";
import type { Exam } from "../../../types";
import {
  timerVisualCandidates,
  type TimerVisualState
} from "./TimerVisuals";

interface TimerDesignPreviewProps {
  exam: Exam;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const timerSamples: Array<{ label: string; ratio: number; state: TimerVisualState }> = [
  { label: "通常", ratio: 0.82, state: "normal" },
  { label: "注意", ratio: 0.15, state: "warning" },
  { label: "危険", ratio: 0.04, state: "critical" }
];

export function TimerDesignPreview({ exam }: TimerDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(timerVisualCandidates[0].id);
  const activeCandidate =
    timerVisualCandidates.find((candidate) => candidate.id === activeCandidateId) ?? timerVisualCandidates[0];
  const totalMs = exam.durationMinutes * 60 * 1000;
  const primarySample = timerSamples[0];
  const ActiveTimer = activeCandidate.component;

  return (
    <section className="exam-design-mode timer-design-mode" aria-label="制限時間デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">時間候補</p>
          <h2>制限時間デザイン候補</h2>
        </div>
        <div className="design-reference-pill">{activeCandidate.reference}</div>
      </header>

      <div className="design-candidate-tabs timer-candidate-tabs" role="tablist" aria-label="制限時間デザイン候補">
        {timerVisualCandidates.map((candidate) => (
          <button
            aria-controls={`timer-panel-${candidate.id}`}
            aria-selected={candidate.id === activeCandidate.id}
            className="design-candidate-tab"
            id={`timer-tab-${candidate.id}`}
            key={candidate.id}
            role="tab"
            type="button"
            onClick={() => setActiveCandidateId(candidate.id)}
          >
            <span>{candidate.name}</span>
            <small>{candidate.shortName} · {candidate.reference}</small>
          </button>
        ))}
      </div>

      <article className="timer-design-canvas" aria-label={`${activeCandidate.name}のプレビュー`}>
        <header className="timer-candidate-header">
          <div>
            <p>{activeCandidate.intent}</p>
            <h3>{activeCandidate.name}</h3>
          </div>
          <span>{exam.durationMinutes}分試験</span>
        </header>

        <div
          aria-labelledby={`timer-tab-${activeCandidate.id}`}
          className="timer-candidate-stage"
          id={`timer-panel-${activeCandidate.id}`}
          role="tabpanel"
        >
          <div className="timer-primary-preview">
            <ActiveTimer
              formatted={formatDuration(totalMs * primarySample.ratio)}
              remainingMs={totalMs * primarySample.ratio}
              size="large"
              state={primarySample.state}
              totalMs={totalMs}
            />
          </div>

          <div className="timer-state-grid" aria-label="通常・注意・危険の比較">
            {timerSamples.map((sample) => {
              const remainingMs = totalMs * sample.ratio;
              return (
                <div className="timer-state-card" key={sample.state}>
                  <span>{sample.label}・残り{Math.round(sample.ratio * 100)}%</span>
                  <ActiveTimer
                    formatted={formatDuration(remainingMs)}
                    remainingMs={remainingMs}
                    size="small"
                    state={sample.state}
                    totalMs={totalMs}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}
