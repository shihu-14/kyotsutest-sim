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

    await user.click(screen.getByRole("button", { name: "ア 1" }));

    expect(onToggleAnswer).toHaveBeenCalledWith(sampleExams[0].questions[0], "-3");
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
    expect(screen.queryByRole("navigation", { name: "大問" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "第2問 問2" })).toBeInTheDocument();
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
});
