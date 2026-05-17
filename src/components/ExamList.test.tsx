import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../data/sampleExam";
import { ExamList } from "./ExamList";

describe("ExamList", () => {
  it("shows the revised card layout and starts the exam", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const exam = sampleExams[0];

    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole("button", { name: "新規作成" })).toBeInTheDocument();
    expect(screen.getByLabelText(`${exam.title}の表紙`)).toBeInTheDocument();

    const card = screen.getByRole("heading", { name: exam.title }).closest("article");
    expect(card).not.toBeNull();

    await user.click(within(card!).getByRole("button", { name: "試験を始める" }));

    expect(onSelect).toHaveBeenCalledWith(exam);
  });

  it("registers the anime TeX exam as a published sample", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026");

    expect(animeExam).toMatchObject({
      title: "漫画映画",
      subject: "漫画映画",
      durationMinutes: 40,
      published: true,
      totalPoints: 100
    });
    expect(animeExam?.pages).toHaveLength(9);
    expect(animeExam?.questions).toHaveLength(9);
  });

  it("opens card actions for edit and delete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const exam = sampleExams[0];

    render(
      <ExamList
        exams={sampleExams}
        onDelete={onDelete}
        onEdit={onEdit}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const card = screen.getByRole("heading", { name: exam.title }).closest("article");
    expect(card).not.toBeNull();

    await user.click(within(card!).getByLabelText(`${exam.title}の設定`));
    await user.click(within(card!).getByRole("button", { name: "編集する" }));
    await user.click(within(card!).getByRole("button", { name: "削除する" }));

    expect(onEdit).toHaveBeenCalledWith(exam);
    expect(onDelete).toHaveBeenCalledWith(exam.id);
  });
});
