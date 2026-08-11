import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { animeOnlymarkExam } from "../../data/exams/animeOnlymark2026";
import { structuredExamFixture } from "../../test/examFixtures";
import { MarkSheet } from "./MarkSheet";

describe("MarkSheet", () => {
  it("toggles answers directly from the sheet", async () => {
    const user = userEvent.setup();
    const onToggleAnswer = vi.fn();

    render(
      <MarkSheet
        activePageId={structuredExamFixture.pages[0].id}
        answers={{}}
        exam={structuredExamFixture}
        onJumpToPage={vi.fn()}
        onToggleAnswer={onToggleAnswer}
      />
    );

    expect(screen.queryByText("←")).not.toBeInTheDocument();
    expect(screen.queryByText("→")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ア 2" }));

    expect(onToggleAnswer).toHaveBeenCalledWith(structuredExamFixture.questions[0], "2");
  });

  it("renders mark choices from 1 through 9 and then 0", () => {
    render(
      <MarkSheet
        activePageId={structuredExamFixture.pages[0].id}
        answers={{}}
        exam={structuredExamFixture}
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    const firstQuestionChoices = screen
      .getAllByRole("button", { name: /^ア [0-9]$/ })
      .map((button) => button.textContent);

    expect(firstQuestionChoices).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
  });

  it("jumps to the target problem page from a question label", async () => {
    const user = userEvent.setup();
    const onJumpToPage = vi.fn();

    render(
      <MarkSheet
        activePageId={structuredExamFixture.pages[0].id}
        answers={{}}
        exam={structuredExamFixture}
        onJumpToPage={onJumpToPage}
        onToggleAnswer={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "ウ" }));

    expect(onJumpToPage).toHaveBeenCalledWith(structuredExamFixture.pages[1].id);
  });

  it("shows section separators for subquestions and keeps the sheet scroll-focused", () => {
    const animeExam = animeOnlymarkExam;

    render(
      <MarkSheet
        activePageId="anime-p04"
        answers={{}}
        exam={animeExam}
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.queryByText("解 答 科 目 欄")).not.toBeInTheDocument();
    expect(screen.queryByText("解答番号")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "大問" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "第2問" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "第2問 問2" })).not.toBeInTheDocument();
  });

  it("marks the provided anime answer key as correct in review mode", () => {
    const animeExam = animeOnlymarkExam;
    const answerKey = [
      "1",
      "3",
      "4",
      "7",
      "2",
      "8",
      "3",
      "6",
      "4",
      "2",
      "1",
      "3",
      "3",
      "2",
      "1",
      "2",
      "1",
      "2",
      "4",
      "2",
      "3"
    ];

    render(
      <MarkSheet
        activePageId="anime-p01"
        answers={{}}
        exam={animeExam}
        reviewMode
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    answerKey.forEach((correctLabel, index) => {
      expect(screen.getByRole("button", { name: `${index + 1} ${correctLabel}` })).toHaveClass("review-correct");
    });
  });

  it("renders multiple selected marks when a question allows multiple answers", () => {
    render(
      <MarkSheet
        activePageId={structuredExamFixture.pages[1].id}
        answers={{ "fixture-q3": ["1", "3"] }}
        exam={structuredExamFixture}
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "ウ 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ウ 3" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the user's wrong review mark black and paints only the correct mark red", () => {
    render(
      <MarkSheet
        activePageId={structuredExamFixture.pages[0].id}
        answers={{ "fixture-q1": ["1"] }}
        exam={structuredExamFixture}
        reviewMode
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "ア" })).toHaveClass("answer-number");
    expect(screen.getByRole("button", { name: "ア" }).closest(".answer-grid-row")).not.toHaveClass(
      "review-incorrect"
    );
    expect(screen.getByRole("button", { name: "ア 1" })).toHaveClass("filled");
    expect(screen.getByRole("button", { name: "ア 1" })).not.toHaveClass("review-wrong");
    expect(screen.getByRole("button", { name: "ア 2" })).toHaveClass("review-correct");
  });

  it("keeps a correct review mark black while adding the red correction layer", () => {
    render(
      <MarkSheet
        activePageId={structuredExamFixture.pages[0].id}
        answers={{ "fixture-q1": ["2"] }}
        exam={structuredExamFixture}
        reviewMode
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByLabelText("デジタルマークシート")).toHaveClass("review-mode");
    expect(screen.getByRole("button", { name: "ア 2" })).toHaveClass("filled");
    expect(screen.getByRole("button", { name: "ア 2" })).toHaveClass("review-correct");
    expect(screen.getByRole("button", { name: "ア 2" })).toHaveAttribute("aria-pressed", "true");
  });
});
