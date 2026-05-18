import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ScoringScreen } from "./ScoringScreen";

describe("ScoringScreen", () => {
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
  });
});
