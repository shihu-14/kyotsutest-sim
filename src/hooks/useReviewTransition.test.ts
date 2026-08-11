import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReviewTransition } from "./useReviewTransition";

describe("useReviewTransition", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("preserves the entering, visible, and settled timing", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useReviewTransition());

    act(() => result.current.startReviewTransition());
    expect(result.current.transitionPhase).toBe("entering");
    expect(result.current.className).toBe("review-mode-fade-in");

    act(() => vi.advanceTimersByTime(0));
    expect(result.current.transitionPhase).toBe("visible");
    expect(result.current.className).toContain("review-mode-fade-in-ready");

    act(() => vi.advanceTimersByTime(619));
    expect(result.current.transitionPhase).toBe("visible");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.transitionPhase).toBe("settled");
    expect(result.current.className).toContain("review-mode-fade-in-settled");

    act(() => result.current.resetReviewTransition());
    expect(result.current.transitionPhase).toBe("idle");
    expect(result.current.className).toBeUndefined();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
