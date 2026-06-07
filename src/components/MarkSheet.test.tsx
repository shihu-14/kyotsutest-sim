import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { MarkSheet } from "./MarkSheet";

describe("MarkSheet", () => {
  it("toggles answers directly from the sheet", async () => {
    const user = userEvent.setup();
    const onToggleAnswer = vi.fn();

    render(
      <MarkSheet
        activePageId="p1"
        answers={{}}
        exam={sampleExams[0]}
        onJumpToPage={vi.fn()}
        onToggleAnswer={onToggleAnswer}
      />
    );

    expect(screen.queryByText("←")).not.toBeInTheDocument();
    expect(screen.queryByText("→")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ア 1" }));

    expect(onToggleAnswer).toHaveBeenCalledWith(sampleExams[0].questions[0], "-3");
  });

  it("renders mark choices from 1 through 9 and then 0", () => {
    render(
      <MarkSheet
        activePageId="p1"
        answers={{}}
        exam={sampleExams[0]}
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
        activePageId="p1"
        answers={{}}
        exam={sampleExams[0]}
        onJumpToPage={onJumpToPage}
        onToggleAnswer={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "ウ" }));

    expect(onJumpToPage).toHaveBeenCalledWith("p2");
  });

  it("shows section separators for subquestions and keeps the sheet scroll-focused", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;

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

  it("renders multiple selected marks when a question allows multiple answers", () => {
    render(
      <MarkSheet
        activePageId="p3"
        answers={{ q5: ["mean6", "range8"] }}
        exam={sampleExams[0]}
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "オ 0" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "オ 2" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the user's wrong review mark black and paints only the correct mark red", () => {
    render(
      <MarkSheet
        activePageId="p1"
        answers={{ q1: ["-4"] }}
        exam={sampleExams[0]}
        reviewMode
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "ア" })).toHaveClass("answer-number");
    expect(screen.getByRole("button", { name: "ア" }).closest(".answer-grid-row")).not.toHaveClass(
      "review-incorrect"
    );
    expect(screen.getByRole("button", { name: "ア 0" })).toHaveClass("filled");
    expect(screen.getByRole("button", { name: "ア 0" })).not.toHaveClass("review-wrong");
    expect(screen.getByRole("button", { name: "ア 1" })).toHaveClass("review-correct");
  });

  it("keeps a correct review mark black while adding the red correction layer", () => {
    render(
      <MarkSheet
        activePageId="p1"
        answers={{ q1: ["-3"] }}
        exam={sampleExams[0]}
        reviewMode
        onJumpToPage={vi.fn()}
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByLabelText("デジタルマークシート")).toHaveClass("review-mode");
    expect(screen.getByRole("button", { name: "ア 1" })).toHaveClass("filled");
    expect(screen.getByRole("button", { name: "ア 1" })).toHaveClass("review-correct");
    expect(screen.getByRole("button", { name: "ア 1" })).toHaveAttribute("aria-pressed", "true");
  });
});
