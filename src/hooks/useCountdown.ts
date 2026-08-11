import { useEffect, useMemo, useState } from "react";

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

export function useCountdown(deadline: number | null, onExpire: () => void): CountdownState {
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
