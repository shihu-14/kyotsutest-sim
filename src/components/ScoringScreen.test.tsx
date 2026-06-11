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
    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onReview={vi.fn()} />);

    expect(screen.queryByRole("heading", { name: "採点" })).not.toBeInTheDocument();
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
      <ScoringScreen answers={{}} exam={sampleExams[0]} startComplete onReview={vi.fn()} />
    );

    expect(screen.getByRole("main")).toHaveClass("scoring-static");
    expect(screen.getByText("最終得点")).toBeInTheDocument();
    expect(screen.getByLabelText("採点結果")).toHaveClass("scoring-final-result");
    expect(document.querySelector(".scoring-review-backdrop")).toBeInTheDocument();
    expect(document.querySelector(".scoring-review-backdrop .page-tabs .cover-tab")).not.toHaveClass("active");
    expect(document.querySelector(".scoring-review-backdrop .page-tab-scroll button.active")).toHaveTextContent("1");
    expect(document.querySelector(".scoring-review-backdrop .booklet-side-arrow.next")).toBeInTheDocument();
    expect(document.querySelector(".scoring-review-backdrop .booklet-side-arrow.previous")).toBeInTheDocument();
    expect(document.querySelector(".scoring-review-backdrop .review-score-badge")).toBeInTheDocument();
    expect(screen.queryByLabelText("問題用紙への採点")).not.toBeInTheDocument();
    expect(document.querySelector(".scoring-final-result button")).not.toBeInTheDocument();
  });

  it("delays from the cover and then stamps answers on the problem booklet", () => {
    vi.useFakeTimers();

    render(<ScoringScreen answers={{}} exam={sampleExams[0]} onReview={vi.fn()} />);

    expect(screen.queryByText("表紙")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("不正解")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(screen.queryByText("1ページ")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(92);
    });

    expect(screen.getAllByLabelText("不正解")[0].querySelector("img.stamp-image-source")).not.toBeNull();
  });

  it("shows only the score pop and then forces review mode", () => {
    vi.useFakeTimers();
    const onReview = vi.fn();
    const baseExam = sampleExams[0];
    const [firstQuestion] = baseExam.questions;
    const quickExam: Exam = {
      ...baseExam,
      coverImageUrl: undefined,
      pages: [
        {
          id: "quick-p1",
          pageNumber: 1,
          title: "即時採点ページ",
          blocks: [
            { type: "heading", text: "即時採点ページ", level: 2 },
            { type: "question", questionId: firstQuestion.id }
          ]
        }
      ],
      questions: [{ ...firstQuestion, pageId: "quick-p1" }],
      totalPoints: firstQuestion.points
    };

    render(<ScoringScreen answers={{}} exam={quickExam} onReview={onReview} />);

    act(() => {
      vi.advanceTimersByTime(92);
    });

    act(() => {
      vi.advanceTimersByTime(167);
    });

    act(() => {
      vi.advanceTimersByTime(136);
    });

    expect(screen.getByLabelText("採点結果")).toHaveClass("auto-review-score-pop");
    expect(screen.getByText("最終得点")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "復習する" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ホームに戻る" })).not.toBeInTheDocument();
    expect(onReview).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(onReview).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onReview).toHaveBeenCalledTimes(1);
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

    render(<ScoringScreen answers={{}} exam={examWithEmptyPage} onReview={vi.fn()} />);

    expect(screen.getByText("採点あり1")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(92);
    });

    act(() => {
      vi.advanceTimersByTime(167);
    });

    expect(screen.getByText("採点なしページ")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(56);
    });

    expect(screen.getByText("採点なしページ")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByText("採点あり2")).toBeInTheDocument();
  });
});
