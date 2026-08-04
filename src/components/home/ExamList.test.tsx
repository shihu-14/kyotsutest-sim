import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../../data/sampleExam";
import { ExamList } from "./ExamList";

describe("ExamList", () => {
  it("draws only after a three-pixel mouse drag and clears the writing", () => {
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const root = screen.getByRole("main");
    const clearButton = screen.getByRole("button", { name: "書き込みを消す" });
    const capturedPointers = new Set<number>();
    const setPointerCapture = vi.fn((pointerId: number) => capturedPointers.add(pointerId));
    const releasePointerCapture = vi.fn((pointerId: number) => capturedPointers.delete(pointerId));
    Object.defineProperties(root, {
      hasPointerCapture: { configurable: true, value: (pointerId: number) => capturedPointers.has(pointerId) },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
      setPointerCapture: { configurable: true, value: setPointerCapture }
    });

    expect(root.querySelector(".home-pencil-canvas")).toHaveAttribute("aria-hidden", "true");
    expect(clearButton).toBeDisabled();

    fireEvent.pointerDown(root, { button: 0, clientX: 20, clientY: 20, pointerId: 7, pointerType: "mouse" });
    fireEvent.pointerUp(root, { clientX: 20, clientY: 20, pointerId: 7, pointerType: "mouse" });
    expect(clearButton).toBeDisabled();

    fireEvent.pointerDown(root, { button: 0, clientX: 20, clientY: 20, pointerId: 8, pointerType: "mouse" });
    fireEvent.pointerMove(root, { buttons: 1, clientX: 22, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(clearButton).toBeDisabled();

    fireEvent.pointerMove(root, { buttons: 1, clientX: 24, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(clearButton).toBeEnabled();
    expect(setPointerCapture).toHaveBeenCalledWith(8);

    fireEvent.pointerUp(root, { clientX: 24, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(releasePointerCapture).toHaveBeenCalledWith(8);

    fireEvent.click(clearButton);
    expect(clearButton).toBeDisabled();
  });

  it("accepts pen input and captures it after the drag threshold", () => {
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const root = screen.getByRole("main");
    const clearButton = screen.getByRole("button", { name: "書き込みを消す" });
    const setPointerCapture = vi.fn();
    Object.defineProperty(root, "setPointerCapture", { configurable: true, value: setPointerCapture });

    fireEvent.pointerDown(root, {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 5,
      pointerType: "pen",
      pressure: 0.2
    });
    fireEvent.pointerMove(root, {
      buttons: 1,
      clientX: 14,
      clientY: 12,
      pointerId: 5,
      pointerType: "pen",
      pressure: 0.8
    });

    expect(clearButton).toBeEnabled();
    expect(setPointerCapture).toHaveBeenCalledWith(5);
  });

  it("ignores drawing gestures that start on cards or use touch input", () => {
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const root = screen.getByRole("main");
    const clearButton = screen.getByRole("button", { name: "書き込みを消す" });
    const card = screen.getByRole("heading", { name: sampleExams[0].title }).closest("article");
    expect(card).not.toBeNull();
    const startButton = within(card!).getByRole("button", { name: "試験を始める" });

    fireEvent.pointerDown(startButton, { button: 0, clientX: 20, clientY: 20, pointerId: 2, pointerType: "mouse" });
    fireEvent.pointerMove(root, { buttons: 1, clientX: 40, clientY: 40, pointerId: 2, pointerType: "mouse" });
    fireEvent.pointerUp(root, { clientX: 40, clientY: 40, pointerId: 2, pointerType: "mouse" });
    expect(clearButton).toBeDisabled();

    fireEvent.pointerDown(card!, { button: 0, clientX: 20, clientY: 20, pointerId: 3, pointerType: "mouse" });
    fireEvent.pointerMove(root, { buttons: 1, clientX: 40, clientY: 40, pointerId: 3, pointerType: "mouse" });
    fireEvent.pointerUp(root, { clientX: 40, clientY: 40, pointerId: 3, pointerType: "mouse" });
    expect(clearButton).toBeDisabled();

    fireEvent.pointerDown(root, { button: 0, clientX: 20, clientY: 20, pointerId: 4, pointerType: "touch" });
    fireEvent.pointerMove(root, { buttons: 1, clientX: 40, clientY: 40, pointerId: 4, pointerType: "touch" });
    fireEvent.pointerUp(root, { clientX: 40, clientY: 40, pointerId: 4, pointerType: "touch" });
    expect(clearButton).toBeDisabled();
  });

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

    expect(screen.getByRole("button", { name: "新規作成" })).toBeDisabled();
    expect(screen.getByLabelText(`${exam.title}の表紙`)).toBeInTheDocument();
    expect(screen.queryByText(exam.subject)).not.toBeInTheDocument();
    expect(screen.queryByText(exam.description)).not.toBeInTheDocument();

    const card = screen.getByRole("heading", { name: exam.title }).closest("article");
    expect(card).not.toBeNull();

    await user.click(within(card!).getByRole("button", { name: "試験を始める" }));

    expect(onSelect).toHaveBeenCalledWith(exam);
  });

  it("registers the anime TeX exam as a published PDF-page sample", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026");

    expect(animeExam).toMatchObject({
      title: "漫画映画",
      subject: "漫画映画",
      durationMinutes: 40,
      published: true,
      totalPoints: 100
    });
    expect(animeExam?.source).toMatchObject({
      kind: "latex-pdf",
      markPlacement: "manual",
      pdfPath: "src/assets/exams/anime-onlymark-2026/source/kyotutest_anime_onlymark.pdf",
      pdfPageImagesPath: "src/assets/exams/anime-onlymark-2026/pdf-pages"
    });
    expect(animeExam?.pages).toHaveLength(14);
    expect(animeExam?.questions).toHaveLength(21);
    expect(animeExam?.pages.every((page) => page.pageImageUrl)).toBe(true);
    expect(animeExam?.pages[13]?.title).toBe("キャラクター一覧");
    expect(animeExam?.questions.reduce((sum, question) => sum + question.points, 0)).toBe(100);
  });

  it("shows disabled card edit actions and keeps delete available", async () => {
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
    expect(within(card!).getByRole("button", { name: "編集する" })).toBeDisabled();
    await user.click(within(card!).getByRole("button", { name: "削除する" }));

    expect(onEdit).not.toHaveBeenCalled();
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
    expect(screen.getByRole("article", { name: "06 Rail Forestのプレビュー" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /10 Rail Wood/ }));

    expect(screen.getByRole("article", { name: "10 Rail Woodのプレビュー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "試験一覧" })).toBeInTheDocument();
  });

  it("opens the editor design candidate mode and switches between ten candidates", async () => {
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

    await user.click(screen.getByRole("button", { name: "編集候補" }));

    expect(screen.getByRole("heading", { name: "編集画面デザイン候補" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("article", { name: "01 Overleaf Splitのプレビュー" })).toBeInTheDocument();
    expect(
      screen.getAllByText(
        (_content, element) => element?.textContent?.includes("\\mark[answer=1,points=10,choices=4]{1}") ?? false
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.queryAllByText(
        (_content, element) => element?.textContent?.includes("\\mark[answer=4,points=10,choices=4]{1}") ?? false
      )
    ).toHaveLength(0);

    await user.click(screen.getByRole("tab", { name: /10 Review Studio/ }));

    expect(screen.getByRole("article", { name: "10 Review Studioのプレビュー" })).toBeInTheDocument();
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

  it("opens the scoring design candidate mode and switches between ten candidates", async () => {
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

    await user.click(screen.getByRole("button", { name: "採点候補" }));

    expect(screen.getByRole("heading", { name: "採点画面デザイン候補" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(10);
    expect(screen.getByRole("article", { name: "01 Ledger Dashboardのプレビュー" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /08 Scoreboard/ }));

    expect(screen.getByRole("article", { name: "08 Scoreboardのプレビュー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "試験一覧" })).toBeInTheDocument();
  });
});
