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

export function StopwatchTimer({ formatted, remainingMs, totalMs, variant = "timer-exam-seal", label }: StopwatchTimerProps) {
  const progress = clampProgress(remainingMs, totalMs);
  const style = {
    "--timer-crown-angle": "90deg",
    "--timer-progress": `${progress * 100}%`,
    "--timer-elapsed": `${(1 - progress) * 100}%`,
    "--timer-progress-angle": `${progress * 360}deg`,
    "--timer-elapsed-angle": `${(1 - progress) * 360}deg`
  } as CSSProperties;

  return (
    <div
      aria-label={label ?? `残り時間 ${formatted}`}
      className={`stopwatch-timer ${variant}`}
      role="timer"
      style={style}
    >
      <div className="stopwatch-crown" aria-hidden="true" />
      <div className="stopwatch-dial">
        <div className="stopwatch-face">
          <strong>{formatted}</strong>
        </div>
      </div>
    </div>
  );
}
