import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ScoringScreen } from "./ScoringScreen";

describe("ScoringScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts scoring on the booklet instead of the old scoring list", () => {
    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onRestart={vi.fn()} onReview={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "採点" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "自動採点" })).not.toBeInTheDocument();
    expect(screen.queryByText("現在の合計点")).not.toBeInTheDocument();
    expect(screen.getByLabelText("問題用紙への採点")).toHaveClass("scoring-booklet-scene");
    expect(screen.queryByLabelText("採点項目")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("採点結果")).not.toBeInTheDocument();
    expect(screen.queryByText("採点済み")).not.toBeInTheDocument();
    expect(screen.queryByText("正答")).not.toBeInTheDocument();
  });

  it("can reopen directly in the completed scoring state", () => {
    render(
      <ScoringScreen answers={{}} exam={sampleExams[0]} startComplete onRestart={vi.fn()} onReview={vi.fn()} />
    );

    expect(screen.getByRole("main")).toHaveClass("scoring-static");
    expect(screen.getByText("最終得点")).toBeInTheDocument();
    expect(screen.getByLabelText("採点結果")).toHaveClass("scoring-final-result");
    expect(screen.queryByLabelText("問題用紙への採点")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "復習する" }).closest(".result-actions")).not.toHaveClass(
      "scoring-result-actions"
    );
    expect(screen.getByRole("button", { name: "メニューに戻る" })).toBeInTheDocument();
  });

  it("delays from the cover and then stamps answers on the problem booklet", () => {
    vi.useFakeTimers();

    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onRestart={vi.fn()} onReview={vi.fn()} />);

    expect(screen.getByText("表紙")).toBeInTheDocument();
    expect(screen.queryByLabelText("不正解")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("1ページ")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(screen.getAllByLabelText("不正解")[0].querySelector(".cross-stroke.first")).not.toBeNull();
  });
});
