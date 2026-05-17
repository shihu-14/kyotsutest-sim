import { render, screen } from "@testing-library/react";
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

    await user.click(screen.getByRole("button", { name: "試験を始める" }));

    expect(onSelect).toHaveBeenCalledWith(exam);
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

    await user.click(screen.getByLabelText(`${exam.title}の設定`));
    await user.click(screen.getByRole("button", { name: "編集する" }));
    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(onEdit).toHaveBeenCalledWith(exam);
    expect(onDelete).toHaveBeenCalledWith(exam.id);
  });
});
