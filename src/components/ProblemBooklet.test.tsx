import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ProblemBooklet } from "./ProblemBooklet";

describe("ProblemBooklet", () => {
  it("syncs clickable marks on exact anime pages with the shared answer state", async () => {
    const user = userEvent.setup();
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = animeExam.questions[0];
    const onToggleAnswer = vi.fn();

    render(
      <ProblemBooklet
        answers={{}}
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        onToggleAnswer={onToggleAnswer}
      />
    );

    await user.click(screen.getByRole("button", { name: "1 4" }));

    expect(onToggleAnswer).toHaveBeenCalledWith(question, "4");
  });

  it("renders selected exact-page marks as filled in review state", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const page = animeExam.pages[0];
    const question = animeExam.questions[0];

    render(
      <ProblemBooklet
        answers={{ [question.id]: ["4"] }}
        page={page}
        questionsById={new Map(animeExam.questions.map((item) => [item.id, item]))}
        reviewMode
        onToggleAnswer={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1 4" })).toHaveClass("filled");
  });
});
