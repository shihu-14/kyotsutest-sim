import { useState } from "react";
import type { Exam } from "../../types";
import { StopwatchTimer } from "../exam/StopwatchTimer";

interface TimerDesignPreviewProps {
  exam: Exam;
}

interface TimerCandidate {
  id: string;
  name: string;
  shortName: string;
  reference: string;
  themeClass: string;
  intent: string;
}

const timerCandidates: TimerCandidate[] = [
  {
    id: "classic-amber",
    name: "01 Classic Amber",
    shortName: "Amber",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-classic-amber",
    intent: "形を固定したまま琥珀色だけを試す"
  },
  {
    id: "exam-seal",
    name: "02 Exam Seal",
    shortName: "Seal",
    reference: "Color only",
    themeClass: "timer-exam-seal",
    intent: "元の赤い検印色に戻した基準案"
  },
  {
    id: "digital-neon",
    name: "03 Digital Neon",
    shortName: "Neon",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-digital-neon",
    intent: "形を固定したまま青緑の強い色だけを試す"
  },
  {
    id: "minimal-ink",
    name: "04 Minimal Ink",
    shortName: "Ink",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-minimal-ink",
    intent: "形を固定したまま墨色だけを試す"
  },
  {
    id: "public-blue",
    name: "05 Public Blue",
    shortName: "Public",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-public-blue",
    intent: "形を固定したまま公的な青だけを試す"
  },
  {
    id: "carbon-gauge",
    name: "06 Carbon Gauge",
    shortName: "Carbon",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-carbon-gauge",
    intent: "形を固定したまま濃い計器色だけを試す"
  },
  {
    id: "glass-dial",
    name: "07 Glass Dial",
    shortName: "Glass",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-glass-dial",
    intent: "形を固定したまま薄い水色だけを試す"
  },
  {
    id: "bento-compact",
    name: "08 Bento Compact",
    shortName: "Bento",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-bento-compact",
    intent: "形を固定したまま紫系だけを試す"
  },
  {
    id: "stadium-alert",
    name: "09 Stadium Alert",
    shortName: "Alert",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-stadium-alert",
    intent: "形を固定したまま警告色だけを試す"
  },
  {
    id: "paper-brass",
    name: "10 Paper Brass",
    shortName: "Brass",
    reference: "Color only",
    themeClass: "timer-exam-seal timer-color-paper-brass",
    intent: "形を固定したまま真鍮色だけを試す"
  }
];

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerDesignPreview({ exam }: TimerDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(timerCandidates[1].id);
  const activeCandidate = timerCandidates.find((candidate) => candidate.id === activeCandidateId) ?? timerCandidates[0];
  const totalMs = exam.durationMinutes * 60 * 1000;
  const samples = [
    { label: "序盤", ratio: 0.82 },
    { label: "中盤", ratio: 0.43 },
    { label: "終盤", ratio: 0.04 }
  ];
  const primaryRemainingMs = totalMs * samples[0].ratio;

  return (
    <section className="exam-design-mode timer-design-mode" aria-label="制限時間デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">Timer candidates</p>
          <h2>制限時間デザイン候補</h2>
        </div>
        <div className="design-reference-pill">{activeCandidate.reference}</div>
      </header>

      <div className="design-candidate-tabs" role="tablist" aria-label="制限時間デザイン候補">
        {timerCandidates.map((candidate) => (
          <button
            aria-selected={candidate.id === activeCandidate.id}
            className="design-candidate-tab"
            key={candidate.id}
            role="tab"
            type="button"
            onClick={() => setActiveCandidateId(candidate.id)}
          >
            <span>{candidate.name}</span>
            <small>{candidate.shortName}</small>
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

        <div className="timer-candidate-stage">
          <div className="timer-primary-preview">
            <StopwatchTimer
              formatted={formatDuration(primaryRemainingMs)}
              remainingMs={primaryRemainingMs}
              totalMs={totalMs}
              variant={`timer-preview-large ${activeCandidate.themeClass}`}
            />
          </div>

          <div className="timer-state-grid" aria-label="残り時間別の表示">
            {samples.map((sample) => {
              const remainingMs = totalMs * sample.ratio;
              return (
                <div className="timer-state-card" key={sample.label}>
                  <span>{sample.label}</span>
                  <StopwatchTimer
                    formatted={formatDuration(remainingMs)}
                    remainingMs={remainingMs}
                    totalMs={totalMs}
                    variant={`timer-preview-small ${activeCandidate.themeClass}`}
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
