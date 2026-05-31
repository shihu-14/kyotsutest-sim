import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ScoringScreen } from "./ScoringScreen";

const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;

describe("ScoringScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("uses the scoring title without the automatic scoring label", () => {
    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onRestart={vi.fn()} onReview={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "採点" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "自動採点" })).not.toBeInTheDocument();
  });

  it("can reopen directly in the completed scoring state", () => {
    render(
      <ScoringScreen answers={{}} exam={sampleExams[0]} startComplete onRestart={vi.fn()} onReview={vi.fn()} />
    );

    expect(screen.getByText("最終得点")).toBeInTheDocument();
    expect(screen.getAllByLabelText("不正解")).toHaveLength(sampleExams[0].questions.length);
    expect(screen.getAllByLabelText("不正解")[0].querySelector(".cross-stroke.first")).not.toBeNull();
    expect(screen.getAllByLabelText("不正解")[0].querySelector(".cross-stroke.second")).not.toBeNull();
  });

  it("scrolls to each newly revealed scoring row", () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onRestart={vi.fn()} onReview={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
  });
});
