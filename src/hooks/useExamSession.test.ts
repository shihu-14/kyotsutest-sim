import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { structuredExamFixture } from "../test/examFixtures";
import { useExamSession } from "./useExamSession";

describe("useExamSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps clock and storage side effects outside the reducer", () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
    const answerKey = `kyotsu-test-sim:answers:${structuredExamFixture.id}`;
    const deadlineKey = `kyotsu-test-sim:deadline:${structuredExamFixture.id}`;
    window.localStorage.setItem(answerKey, JSON.stringify({ q1: ["2"] }));
    const { result } = renderHook(() => useExamSession());

    act(() => result.current.openCover(structuredExamFixture));
    expect(result.current.state.phase).toBe("cover");
    expect(result.current.state.answers).toEqual({ q1: ["2"] });
    expect(window.localStorage.getItem(deadlineKey)).toBeNull();

    act(() => result.current.startExam());
    const expectedDeadline = 1_000 + structuredExamFixture.durationMinutes * 60 * 1000;
    expect(result.current.state).toMatchObject({ answers: {}, deadline: expectedDeadline, phase: "exam" });
    expect(window.localStorage.getItem(answerKey)).toBe("{}");
    expect(window.localStorage.getItem(deadlineKey)).toBe(String(expectedDeadline));

    act(() => result.current.finishExam());
    expect(result.current.state.phase).toBe("scoring");
    expect(window.localStorage.getItem(deadlineKey)).toBeNull();
    now.mockRestore();
  });
});
