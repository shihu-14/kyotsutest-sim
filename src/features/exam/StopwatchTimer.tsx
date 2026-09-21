import { useEffect, useMemo, useState, type CSSProperties } from "react";

interface StopwatchTimerProps {
  formatted: string;
  remainingMs: number;
  totalMs: number;
}

function clampProgress(remainingMs: number, totalMs: number) {
  if (totalMs <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, remainingMs / totalMs));
}

export function StopwatchTimer({ formatted, remainingMs, totalMs }: StopwatchTimerProps) {
  const progress = clampProgress(remainingMs, totalMs);
  const style = {
    "--timer-crown-angle": "90deg",
    "--timer-elapsed-angle": `${(1 - progress) * 360}deg`
  } as CSSProperties;

  return (
    <div aria-label={`残り時間 ${formatted}`} className="stopwatch-timer" role="timer" style={style}>
      <div className="stopwatch-crown" aria-hidden="true" />
      <div className="stopwatch-dial">
        <div className="stopwatch-face">
          <strong>{formatted}</strong>
        </div>
      </div>
    </div>
  );
}

interface CountdownState {
  remainingMs: number;
  formatted: string;
  isExpired: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useCountdown(deadline: number | null, onExpire: () => void): CountdownState {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [deadline]);

  const remainingMs = deadline ? Math.max(0, deadline - now) : 0;
  const isExpired = Boolean(deadline && remainingMs <= 0);

  useEffect(() => {
    if (isExpired) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  return useMemo(
    () => ({
      remainingMs,
      formatted: formatDuration(remainingMs),
      isExpired
    }),
    [remainingMs, isExpired]
  );
}

export function ExamTimer({
  deadline,
  totalMs,
  onExpire
}: {
  deadline: number | null;
  totalMs: number;
  onExpire: () => void;
}) {
  const countdown = useCountdown(deadline, onExpire);
  return <StopwatchTimer formatted={countdown.formatted} remainingMs={countdown.remainingMs} totalMs={totalMs} />;
}
