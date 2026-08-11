import { useCallback, useEffect, useState } from "react";

export type ReviewTransitionPhase = "idle" | "entering" | "visible" | "settled";

export function useReviewTransition() {
  const [transitionPhase, setTransitionPhase] = useState<ReviewTransitionPhase>("idle");
  const active = transitionPhase !== "idle";

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const showTimeoutId = window.setTimeout(() => setTransitionPhase("visible"), 0);
    const settleTimeoutId = window.setTimeout(() => setTransitionPhase("settled"), 620);
    return () => {
      window.clearTimeout(showTimeoutId);
      window.clearTimeout(settleTimeoutId);
    };
  }, [active]);

  const startReviewTransition = useCallback(() => {
    setTransitionPhase("entering");
  }, []);

  const resetReviewTransition = useCallback(() => {
    setTransitionPhase("idle");
  }, []);

  const className = [
    active ? "review-mode-fade-in" : "",
    transitionPhase === "visible" || transitionPhase === "settled" ? "review-mode-fade-in-ready" : "",
    transitionPhase === "settled" ? "review-mode-fade-in-settled" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return {
    className: className || undefined,
    resetReviewTransition,
    startReviewTransition,
    transitionPhase
  };
}
