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
    expect(animeExam?.pages).toHaveLength(13);
    expect(animeExam?.questions).toHaveLength(20);
    expect(animeExam?.pages.every((page) => page.pageImageUrl)).toBe(true);
    expect(animeExam?.pages[12]?.title).toBe("キャラクター一覧");
    expect(animeExam?.questions.reduce((sum, question) => sum + question.points, 0)).toBe(100);
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

  it("opens the exam screen design candidate mode and switches between ten candidates", async () => {
    const user = userEvent.setup();

    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "画面候補" }));

    expect(screen.getByRole("heading", { name: "解答画面デザイン候補" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("article", { name: "01 Focus Commandのプレビュー" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /06 Carbon Console/ }));

    expect(screen.getByRole("article", { name: "06 Carbon Consoleのプレビュー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "試験一覧" })).toBeInTheDocument();
  });

  it("opens the timer design candidate mode and switches stopwatch candidates", async () => {
    const user = userEvent.setup();

    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "時間候補" }));

    expect(screen.getByRole("heading", { name: "制限時間デザイン候補" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("article", { name: "02 Exam Sealのプレビュー" })).toBeInTheDocument();
    expect(screen.getAllByRole("timer", { name: /残り時間/ })).toHaveLength(4);

    await user.click(screen.getByRole("tab", { name: /09 Stadium Alert/ }));

    const preview = screen.getByRole("article", { name: "09 Stadium Alertのプレビュー" });
    expect(preview).toBeInTheDocument();
    expect(within(preview).getAllByRole("timer", { name: /残り時間/ })[0]).toHaveClass(
      "timer-exam-seal",
      "timer-color-stadium-alert"
    );
  });

  it("opens the home screen design candidate mode and switches between ten candidates", async () => {
    const user = userEvent.setup();

    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "ホーム候補" }));

    expect(screen.getByRole("heading", { name: "ホーム画面デザイン候補" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("article", { name: "01 Exam Cardsのプレビュー" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /06 Bento Board/ }));

    expect(screen.getByRole("article", { name: "06 Bento Boardのプレビュー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "試験一覧" })).toBeInTheDocument();
  });

  it("opens the page navigation design candidate mode and switches between ten candidates", async () => {
    const user = userEvent.setup();

    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "ページ候補" }));

    expect(screen.getByRole("heading", { name: "ページ遷移UI候補" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("article", { name: "01 Fine Outlineのプレビュー" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /10 Bold Outline/ }));

    expect(screen.getByRole("article", { name: "10 Bold Outlineのプレビュー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "試験一覧" })).toBeInTheDocument();
  });
});
