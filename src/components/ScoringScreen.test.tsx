import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import type { Exam } from "../types";
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
    expect(document.querySelector(".scoring-progress-note")).not.toBeInTheDocument();
  });

  it("can reopen directly in the completed scoring state", () => {
    render(
      <ScoringScreen answers={{}} exam={sampleExams[0]} startComplete onRestart={vi.fn()} onReview={vi.fn()} />
    );

    expect(screen.getByRole("main")).toHaveClass("scoring-static");
    expect(screen.getByText("最終得点")).toBeInTheDocument();
    expect(screen.getByLabelText("採点結果")).toHaveClass("scoring-final-result");
    expect(document.querySelector(".scoring-review-backdrop")).toBeInTheDocument();
    expect(screen.queryByLabelText("問題用紙への採点")).not.toBeInTheDocument();
    expect(screen.getByText("復習する").closest(".result-actions")).not.toHaveClass("scoring-result-actions");
    expect(document.querySelector(".scoring-final-result .secondary-button")).toHaveTextContent("ホームに戻る");
  });

  it("delays from the cover and then stamps answers on the problem booklet", () => {
    vi.useFakeTimers();

    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onRestart={vi.fn()} onReview={vi.fn()} />);

    expect(screen.queryByText("表紙")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("不正解")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("1ページ")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(screen.getAllByLabelText("不正解")[0].querySelector("path.cross-stroke.first")).not.toBeNull();
  });

  it("turns pages without grading targets faster than graded pages", () => {
    vi.useFakeTimers();

    const baseExam = sampleExams[0];
    const [firstQuestion, secondQuestion] = baseExam.questions;
    const examWithEmptyPage: Exam = {
      ...baseExam,
      id: "empty-page-speed-check",
      coverImageUrl: undefined,
      pages: [
        {
          id: "speed-p1",
          pageNumber: 1,
          title: "採点あり1",
          blocks: [
            { type: "heading", text: "採点あり1", level: 2 },
            { type: "question", questionId: firstQuestion.id }
          ]
        },
        {
          id: "speed-p2",
          pageNumber: 2,
          title: "採点なしページ",
          blocks: [{ type: "heading", text: "採点なしページ", level: 2 }]
        },
        {
          id: "speed-p3",
          pageNumber: 3,
          title: "採点あり2",
          blocks: [
            { type: "heading", text: "採点あり2", level: 2 },
            { type: "question", questionId: secondQuestion.id }
          ]
        }
      ],
      questions: [
        { ...firstQuestion, pageId: "speed-p1" },
        { ...secondQuestion, pageId: "speed-p3" }
      ],
      totalPoints: firstQuestion.points + secondQuestion.points
    };

    render(<ScoringScreen answers={{}} exam={examWithEmptyPage} onRestart={vi.fn()} onReview={vi.fn()} />);

    expect(screen.getByText("採点あり1")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(420);
    });

    act(() => {
      vi.advanceTimersByTime(760);
    });

    expect(screen.getByText("採点なしページ")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(259);
    });

    expect(screen.getByText("採点なしページ")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByText("採点あり2")).toBeInTheDocument();
  });
});
