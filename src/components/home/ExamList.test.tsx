import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { sampleExams } from "../../data/sampleExam";
import { useHomePencilDrawing } from "../../hooks/useHomePencilDrawing";
import { ExamList } from "./ExamList";

function installPointerCapture(element: HTMLElement) {
  const capturedPointers = new Set<number>();
  const setPointerCapture = vi.fn((pointerId: number) => capturedPointers.add(pointerId));
  const releasePointerCapture = vi.fn((pointerId: number) => capturedPointers.delete(pointerId));
  Object.defineProperties(element, {
    hasPointerCapture: { configurable: true, value: (pointerId: number) => capturedPointers.has(pointerId) },
    releasePointerCapture: { configurable: true, value: releasePointerCapture },
    setPointerCapture: { configurable: true, value: setPointerCapture }
  });

  return { releasePointerCapture, setPointerCapture };
}

function installCanvasContext() {
  const clearRect = vi.fn();
  const stroke = vi.fn();
  const context = {
    beginPath: vi.fn(),
    clearRect,
    lineCap: "butt",
    lineDashOffset: 0,
    lineJoin: "miter",
    lineTo: vi.fn(),
    lineWidth: 1,
    moveTo: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    stroke,
    strokeStyle: "#000"
  } as unknown as CanvasRenderingContext2D;
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context);

  return { clearRect, stroke };
}

function dragFrom(target: Element, surface: HTMLElement, pointerId: number, pointerType = "mouse") {
  fireEvent.pointerDown(target, { button: 0, clientX: 20, clientY: 20, pointerId, pointerType });
  fireEvent.pointerMove(surface, { buttons: 1, clientX: 25, clientY: 22, pointerId, pointerType });
  fireEvent.pointerUp(surface, { clientX: 25, clientY: 22, pointerId, pointerType });
}

function PencilExclusionHarness() {
  const { canvasRef, hasDrawing, pointerHandlers, rootRef } = useHomePencilDrawing();

  return (
    <div className="pencil-exclusion-harness" ref={rootRef} {...pointerHandlers}>
      <canvas ref={canvasRef} />
      <a href="#pencil-link">リンク</a>
      <button type="button">ボタン</button>
      <details>
        <summary>設定</summary>
      </details>
      <div data-pencil-drawing-exclusion>明示的な除外領域</div>
      <span data-testid="drawing-state">{hasDrawing ? "drawing" : "empty"}</span>
    </div>
  );
}

describe("ExamList", () => {
  it("continues scheduling and painting animation frames in StrictMode", () => {
    const scheduledFrames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const frameId = ++nextFrameId;
      scheduledFrames.set(frameId, callback);
      return frameId;
    });
    const cancelAnimationFrame = vi.fn((frameId: number) => {
      scheduledFrames.delete(frameId);
    });
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

    let unmount: (() => void) | undefined;

    try {
      const { stroke } = installCanvasContext();
      ({ unmount } = render(
        <StrictMode>
          <ExamList
            exams={sampleExams}
            onDelete={vi.fn()}
            onEdit={vi.fn()}
            onOpenEditor={vi.fn()}
            onSelect={vi.fn()}
          />
        </StrictMode>
      ));

      const surface = screen.getByRole("main").parentElement;
      if (!surface) {
        throw new Error("home pencil surface was not rendered");
      }

      const runNextAnimationFrame = () => {
        const nextFrame = scheduledFrames.entries().next().value as [number, FrameRequestCallback] | undefined;
        if (!nextFrame) {
          throw new Error("no animation frame was scheduled");
        }

        const [frameId, callback] = nextFrame;
        scheduledFrames.delete(frameId);
        callback(performance.now());
      };

      expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
      expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
      expect(scheduledFrames.size).toBe(1);

      act(runNextAnimationFrame);
      installPointerCapture(surface);

      fireEvent.pointerDown(surface, {
        button: 0,
        clientX: 20,
        clientY: 20,
        pointerId: 41,
        pointerType: "mouse"
      });
      fireEvent.pointerMove(surface, {
        buttons: 1,
        clientX: 25,
        clientY: 22,
        pointerId: 41,
        pointerType: "mouse"
      });

      expect(scheduledFrames.size).toBe(1);
      act(runNextAnimationFrame);
      expect(stroke).toHaveBeenCalled();

      const strokeCountBeforePointerUp = stroke.mock.calls.length;
      fireEvent.pointerUp(surface, { clientX: 25, clientY: 22, pointerId: 41, pointerType: "mouse" });

      expect(scheduledFrames.size).toBe(1);
      act(runNextAnimationFrame);
      expect(stroke.mock.calls.length).toBeGreaterThan(strokeCountBeforePointerUp);
    } finally {
      unmount?.();
      vi.unstubAllGlobals();
    }
  });

  it("uses a full-page surface and preserves the threshold, capture, and clear behavior", async () => {
    const { clearRect, stroke } = installCanvasContext();
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const main = screen.getByRole("main");
    const surface = main.parentElement;
    expect(surface).toHaveClass("home-pencil-surface");
    if (!surface) {
      throw new Error("home pencil surface was not rendered");
    }

    const clearButton = screen.getByRole("button", { name: "書き込みを消す" });
    const { releasePointerCapture, setPointerCapture } = installPointerCapture(surface);

    expect(surface.querySelector(":scope > .home-pencil-canvas")).toHaveAttribute("aria-hidden", "true");
    expect(surface.querySelector(":scope > main")).toBe(main);
    expect(clearButton).toBeDisabled();

    fireEvent.pointerDown(surface, { button: 0, clientX: 20, clientY: 20, pointerId: 7, pointerType: "mouse" });
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    fireEvent.pointerMove(surface, { buttons: 1, clientX: 22, clientY: 20, pointerId: 7, pointerType: "mouse" });
    expect(clearButton).toBeDisabled();
    fireEvent.pointerUp(surface, { clientX: 22, clientY: 20, pointerId: 7, pointerType: "mouse" });
    expect(releasePointerCapture).toHaveBeenCalledWith(7);

    fireEvent.pointerDown(surface, { button: 0, clientX: 20, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(setPointerCapture).toHaveBeenCalledWith(8);
    fireEvent.pointerMove(surface, { buttons: 1, clientX: 24, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(clearButton).toBeEnabled();
    await waitFor(() => expect(stroke).toHaveBeenCalled());

    const strokeCountBeforePointerUp = stroke.mock.calls.length;
    fireEvent.pointerUp(surface, { clientX: 24, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(releasePointerCapture).toHaveBeenCalledWith(8);
    await waitFor(() => expect(stroke.mock.calls.length).toBeGreaterThan(strokeCountBeforePointerUp));

    clearRect.mockClear();
    stroke.mockClear();
    fireEvent.click(clearButton);
    expect(clearButton).toBeDisabled();
    await waitFor(() => expect(clearRect).toHaveBeenCalled());
    expect(stroke).not.toHaveBeenCalled();

    const clearCountBeforeResize = clearRect.mock.calls.length;
    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(clearRect.mock.calls.length).toBeGreaterThan(clearCountBeforeResize));
    expect(stroke).not.toHaveBeenCalled();
  });

  it("draws from the outer margin, an exam-grid gap, and a non-action part of an article", () => {
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const surface = screen.getByRole("main").parentElement;
    if (!surface) {
      throw new Error("home pencil surface was not rendered");
    }

    const clearButton = screen.getByRole("button", { name: "書き込みを消す" });
    installPointerCapture(surface);
    const grid = screen.getByRole("region", { name: "公開中の試験一覧" });
    const article = screen.getByRole("heading", { name: sampleExams[0].title }).closest("article");
    expect(article).not.toBeNull();

    [surface, grid, article!].forEach((target, index) => {
      dragFrom(target, surface, index + 10);
      expect(clearButton).toBeEnabled();
      fireEvent.click(clearButton);
      expect(clearButton).toBeDisabled();
    });
  });

  it("captures pen input on pointerdown and draws only after the threshold", () => {
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const surface = screen.getByRole("main").parentElement;
    if (!surface) {
      throw new Error("home pencil surface was not rendered");
    }

    const clearButton = screen.getByRole("button", { name: "書き込みを消す" });
    const { setPointerCapture } = installPointerCapture(surface);

    fireEvent.pointerDown(surface, {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 5,
      pointerType: "pen",
      pressure: 0.2
    });
    expect(setPointerCapture).toHaveBeenCalledWith(5);
    expect(clearButton).toBeDisabled();

    fireEvent.pointerMove(surface, {
      buttons: 1,
      clientX: 14,
      clientY: 12,
      pointerId: 5,
      pointerType: "pen",
      pressure: 0.8
    });

    expect(clearButton).toBeEnabled();
  });

  it("does not capture or draw from buttons, links, summaries, explicit exclusions, or touch", () => {
    render(<PencilExclusionHarness />);

    const surface = document.querySelector<HTMLElement>(".pencil-exclusion-harness");
    if (!surface) {
      throw new Error("pencil exclusion harness was not rendered");
    }

    const { setPointerCapture } = installPointerCapture(surface);
    const state = screen.getByTestId("drawing-state");
    const excludedTargets = [
      screen.getByRole("button", { name: "ボタン" }),
      screen.getByRole("link", { name: "リンク" }),
      screen.getByText("設定"),
      screen.getByText("明示的な除外領域")
    ];

    excludedTargets.forEach((target, index) => {
      dragFrom(target, surface, index + 20);
      expect(state).toHaveTextContent("empty");
    });

    dragFrom(surface, surface, 30, "touch");
    expect(state).toHaveTextContent("empty");
    expect(setPointerCapture).not.toHaveBeenCalled();
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
