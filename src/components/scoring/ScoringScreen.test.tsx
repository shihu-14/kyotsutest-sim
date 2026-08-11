import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import gradeCircleStamp from "../../assets/stamps/grade-circle.png";
import gradeCrossStamp from "../../assets/stamps/grade-cross.png";
import { structuredExamFixture } from "../../test/examFixtures";
import type { Exam } from "../../types";
import { ScoringScreen } from "./ScoringScreen";

describe("ScoringScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts scoring on the booklet instead of the old scoring list", () => {
    render(<ScoringScreen answers={{}} exam={structuredExamFixture} onReview={vi.fn()} />);

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
      <ScoringScreen answers={{}} exam={structuredExamFixture} startComplete onReview={vi.fn()} />
    );

    expect(screen.getByRole("main")).toHaveClass("scoring-static");
    expect(document.querySelector(".scoring-final-content p")).toHaveTextContent("得点");
    expect(screen.queryByText("最終得点")).not.toBeInTheDocument();
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

    render(<ScoringScreen answers={{}} exam={structuredExamFixture} onReview={vi.fn()} />);

    expect(screen.queryByText("表紙")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("不正解")).not.toBeInTheDocument();
    expect(document.querySelector(".choice-button.correct-choice")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("1ページ")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("不正解")).not.toBeInTheDocument();
    expect(document.querySelector(".choice-button.correct-choice")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(419);
    });

    expect(screen.queryByLabelText("不正解")).not.toBeInTheDocument();
    expect(document.querySelector(".choice-button.correct-choice")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    const cross = screen.getAllByLabelText("不正解")[0];
    expect(cross).toHaveClass("grade-stamp", "red-pen", "cross", "is-drawing");
    expect(cross.querySelector("svg.stamp-drawing")).toHaveAttribute("viewBox", "0 0 970 1074");
    expect(cross.querySelector("image.stamp-asset")).toHaveAttribute("href", gradeCrossStamp);
    expect(cross.querySelectorAll("path.cross-reveal-stroke")).toHaveLength(2);
    expect(cross.querySelector("path.cross-reveal-stroke.first")).not.toBeNull();
    expect(cross.querySelector("path.cross-reveal-stroke.second")).not.toBeNull();
    expect(document.querySelector(".choice-button.correct-choice")).toBeInTheDocument();
  });

  it("draws a correct stamp as one animated circle path", () => {
    vi.useFakeTimers();
    const exam = structuredExamFixture;
    const firstQuestion = exam.questions[0];

    render(
      <ScoringScreen
        answers={{ [firstQuestion.id]: firstQuestion.correct }}
        exam={exam}
        onReview={vi.fn()}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      vi.advanceTimersByTime(420);
    });

    const circle = screen.getAllByLabelText("正解")[0];
    expect(circle).toHaveClass("grade-stamp", "red-pen", "circle", "is-drawing");
    expect(circle.querySelector("svg.stamp-drawing")).toHaveAttribute("viewBox", "0 0 450 332");
    expect(circle.querySelector("image.stamp-asset")).toHaveAttribute("href", gradeCircleStamp);
    expect(circle.querySelectorAll("path.circle-reveal-stroke")).toHaveLength(1);
    expect(circle.querySelector("path.circle-reveal-stroke")).toHaveAttribute("pathLength", "1");
    expect(circle.querySelector("path.circle-reveal-stroke")).toHaveAttribute(
      "d",
      expect.stringMatching(/^M218 280/)
    );
  });

  it("pauses on the score pop without entering review in debug mode", () => {
    vi.useFakeTimers();
    const onReview = vi.fn();
    const baseExam = structuredExamFixture;
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
      vi.advanceTimersByTime(420);
    });

    act(() => {
      vi.advanceTimersByTime(760);
    });

    act(() => {
      vi.advanceTimersByTime(620);
    });

    expect(screen.getByLabelText("採点結果")).toHaveClass("auto-review-score-pop");
    expect(document.querySelector(".scoring-final-content p")).toHaveTextContent("得点");
    expect(screen.queryByRole("button", { name: "復習する" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ホームに戻る" })).not.toBeInTheDocument();
    expect(onReview).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByLabelText("採点結果")).toHaveClass("auto-review-score-pop");
    expect(onReview).not.toHaveBeenCalled();
  });

  it("turns pages without grading targets faster than graded pages", () => {
    vi.useFakeTimers();

    const baseExam = structuredExamFixture;
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
