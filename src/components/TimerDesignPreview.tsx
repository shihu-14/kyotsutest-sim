import { useState } from "react";
import type { Exam } from "../types";
import { StopwatchTimer } from "./StopwatchTimer";

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
    reference: "Provided stopwatch",
    themeClass: "timer-classic-amber",
    intent: "提示画像に近い黄色いストップウォッチ"
  },
  {
    id: "exam-seal",
    name: "02 Exam Seal",
    shortName: "Seal",
    reference: "Common test paper",
    themeClass: "timer-exam-seal",
    intent: "試験用紙に馴染む赤い検印風"
  },
  {
    id: "digital-neon",
    name: "03 Digital Neon",
    shortName: "Neon",
    reference: "Sports timer",
    themeClass: "timer-digital-neon",
    intent: "暗い画面で即座に読める発光表示"
  },
  {
    id: "minimal-ink",
    name: "04 Minimal Ink",
    shortName: "Ink",
    reference: "Swiss clock",
    themeClass: "timer-minimal-ink",
    intent: "白黒で邪魔をしない最小表現"
  },
  {
    id: "public-blue",
    name: "05 Public Blue",
    shortName: "Public",
    reference: "Public service UI",
    themeClass: "timer-public-blue",
    intent: "高コントラストで緊急度を明確にする"
  },
  {
    id: "carbon-gauge",
    name: "06 Carbon Gauge",
    shortName: "Carbon",
    reference: "Technical console",
    themeClass: "timer-carbon-gauge",
    intent: "計器盤として残量を数値化する"
  },
  {
    id: "glass-dial",
    name: "07 Glass Dial",
    shortName: "Glass",
    reference: "Native glass UI",
    themeClass: "timer-glass-dial",
    intent: "透明な盤面で背景を生かす"
  },
  {
    id: "bento-compact",
    name: "08 Bento Compact",
    shortName: "Bento",
    reference: "Compact dashboard",
    themeClass: "timer-bento-compact",
    intent: "小さなツールバーに収まる密度"
  },
  {
    id: "stadium-alert",
    name: "09 Stadium Alert",
    shortName: "Alert",
    reference: "Scoreboard",
    themeClass: "timer-stadium-alert",
    intent: "終盤の圧を強く出す大型表示"
  },
  {
    id: "paper-brass",
    name: "10 Paper Brass",
    shortName: "Brass",
    reference: "Desk object",
    themeClass: "timer-paper-brass",
    intent: "木目背景に置いた金属計器"
  }
];

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerDesignPreview({ exam }: TimerDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(timerCandidates[0].id);
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
