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
});
