import type { CSSProperties } from "react";

interface StopwatchTimerProps {
  formatted: string;
  remainingMs: number;
  totalMs: number;
  variant?: string;
  label?: string;
}

function clampProgress(remainingMs: number, totalMs: number) {
  if (totalMs <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, remainingMs / totalMs));
}

export function StopwatchTimer({ formatted, remainingMs, totalMs, variant = "timer-classic-amber", label }: StopwatchTimerProps) {
  const progress = clampProgress(remainingMs, totalMs);
  const style = {
    "--timer-progress": `${progress * 100}%`,
    "--timer-angle": `${progress * 360}deg`
  } as CSSProperties;

  return (
    <div
      aria-label={label ?? `残り時間 ${formatted}`}
      className={`stopwatch-timer ${variant} ${remainingMs <= 60_000 ? "urgent" : ""}`}
      role="timer"
      style={style}
    >
      <div className="stopwatch-crown" aria-hidden="true" />
      <div className="stopwatch-side-button left" aria-hidden="true" />
      <div className="stopwatch-side-button right" aria-hidden="true" />
      <div className="stopwatch-dial">
        <div className="stopwatch-face">
          <span className="stopwatch-kicker">残り</span>
          <strong>{formatted}</strong>
          <span className="stopwatch-meter-text">{Math.round(progress * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
