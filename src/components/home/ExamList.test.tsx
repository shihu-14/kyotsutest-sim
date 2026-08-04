import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleExams } from "../../data/sampleExam";
import { useHomePencilDrawing } from "../../hooks/useHomePencilDrawing";
import { ExamList } from "./ExamList";
import { HomeDrawingTools } from "./HomeDrawingTools";

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
  const renderEvents: string[] = [];
  const fillRect = vi.fn(() => renderEvents.push("erase"));
  const stroke = vi.fn(() => renderEvents.push("stroke"));
  let compositeOperation = "source-over";
  const context = {
    beginPath: vi.fn(),
    clearRect,
    fillRect,
    fillStyle: "#000",
    lineCap: "butt",
    lineDashOffset: 0,
    lineJoin: "miter",
    lineTo: vi.fn(),
    lineWidth: 1,
    moveTo: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    stroke,
    strokeStyle: "#000",
    translate: vi.fn()
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(context, "globalCompositeOperation", {
    configurable: true,
    get: () => compositeOperation,
    set: (value: string) => {
      compositeOperation = value;
      renderEvents.push(value);
    }
  });
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context);

  return { clearRect, context, fillRect, renderEvents, stroke };
}

function pickTool(kind: "pencil" | "eraser", pointerType = "mouse") {
  const label = kind === "pencil" ? "鉛筆を拾う" : "消しゴムを拾う";
  const tool = screen.getByRole("button", { name: label });
  expect(tool).toBeEnabled();
  fireEvent.pointerUp(tool, { clientX: 80, clientY: 80, pointerId: 1, pointerType });
  expect(tool).toHaveAttribute("data-tool-phase", "held");
  return tool;
}

function dragFrom(target: Element, surface: HTMLElement, pointerId: number, pointerType = "mouse") {
  fireEvent.pointerDown(target, { button: 0, clientX: 20, clientY: 20, pointerId, pointerType });
  fireEvent.pointerMove(surface, { buttons: 1, clientX: 25, clientY: 22, pointerId, pointerType });
  fireEvent.pointerUp(surface, { clientX: 25, clientY: 22, pointerId, pointerType });
}

function dispatchPointerEvent(target: Element, type: string, init: PointerEventInit) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, ...init });
  fireEvent(target, event);
  return event;
}

function PencilExclusionHarness() {
  const {
    canvasRef,
    hasDrawing,
    pickUpTool,
    pointerHandlers,
    registerToolElement,
    rootRef,
    toolPhases
  } = useHomePencilDrawing();

  return (
    <div className="pencil-exclusion-harness" ref={rootRef} {...pointerHandlers}>
      <canvas ref={canvasRef} />
      <a href="#pencil-link">リンク</a>
      <button type="button">ボタン</button>
      <details>
        <summary>設定</summary>
      </details>
      <article>カードの非操作部分</article>
      <div data-pencil-drawing-exclusion>明示的な除外領域</div>
      <span data-testid="drawing-state">{hasDrawing ? "drawing" : "empty"}</span>
      <HomeDrawingTools
        onPickTool={pickUpTool}
        phases={toolPhases}
        registerToolElement={registerToolElement}
      />
    </div>
  );
}

describe("ExamList", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn()
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn()
    })));

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
      pickTool("pencil");

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

  it("rebooks both Canvas and physics frames after the first StrictMode cleanup", () => {
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
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn()
    })));
    installCanvasContext();

    const { unmount } = render(
      <StrictMode>
        <ExamList
          exams={sampleExams}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          onOpenEditor={vi.fn()}
          onSelect={vi.fn()}
        />
      </StrictMode>
    );

    expect(requestAnimationFrame).toHaveBeenCalledTimes(4);
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    expect(scheduledFrames.size).toBe(2);

    unmount();
    expect(scheduledFrames.size).toBe(0);
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
    expect(surface.querySelector(":scope > .home-drawing-tool-layer")).toBeInTheDocument();
    expect(clearButton).toBeDisabled();

    const noToolPointerDown = dispatchPointerEvent(surface, "pointerdown", {
      button: 0,
      clientX: 20,
      clientY: 20,
      pointerId: 6,
      pointerType: "mouse"
    });
    expect(noToolPointerDown.defaultPrevented).toBe(false);
    expect(setPointerCapture).not.toHaveBeenCalled();

    pickTool("pencil");
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

  it("prevents selection on pointerdown and clears the dragging class on every finish path", () => {
    const { unmount } = render(
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

    installPointerCapture(surface);
    pickTool("pencil");
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((finishEvent, index) => {
      const pointerId = index + 51;
      const pointerDown = dispatchPointerEvent(surface, "pointerdown", {
        button: 0,
        clientX: 20,
        clientY: 20,
        pointerId,
        pointerType: "mouse"
      });

      expect(pointerDown.defaultPrevented).toBe(true);
      expect(surface).toHaveClass("is-pencil-dragging");

      dispatchPointerEvent(surface, finishEvent, {
        clientX: 20,
        clientY: 20,
        pointerId,
        pointerType: "mouse"
      });

      expect(surface).not.toHaveClass("is-pencil-dragging");
    });

    const pointerDown = dispatchPointerEvent(surface, "pointerdown", {
      button: 0,
      clientX: 20,
      clientY: 20,
      pointerId: 54,
      pointerType: "mouse"
    });
    expect(pointerDown.defaultPrevented).toBe(true);
    expect(surface).toHaveClass("is-pencil-dragging");

    unmount();
    expect(surface).not.toHaveClass("is-pencil-dragging");
  });

  it("clears the dragging class when the drawing is cleared", () => {
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

    installPointerCapture(surface);
    pickTool("pencil");
    dispatchPointerEvent(surface, "pointerdown", {
      button: 0,
      clientX: 20,
      clientY: 20,
      pointerId: 55,
      pointerType: "mouse"
    });
    fireEvent.pointerMove(surface, {
      buttons: 1,
      clientX: 25,
      clientY: 22,
      pointerId: 55,
      pointerType: "mouse"
    });

    expect(surface).toHaveClass("is-pencil-dragging");
    fireEvent.click(screen.getByRole("button", { name: "書き込みを消す" }));
    expect(surface).not.toHaveClass("is-pencil-dragging");
  });

  it("finishes an active gesture when reduced motion is enabled", () => {
    let handleMotionChange: ((event: MediaQueryListEvent) => void) | undefined;
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        handleMotionChange = listener;
      },
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn()
    })));
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
    const { releasePointerCapture } = installPointerCapture(surface);
    pickTool("pencil");
    dragFrom(surface, surface, 56);
    fireEvent.pointerDown(surface, {
      button: 0,
      clientX: 30,
      clientY: 30,
      pointerId: 57,
      pointerType: "mouse"
    });
    fireEvent.pointerMove(surface, {
      buttons: 1,
      clientX: 36,
      clientY: 32,
      pointerId: 57,
      pointerType: "mouse"
    });
    expect(surface).toHaveClass("is-pencil-dragging");

    act(() => handleMotionChange?.({ matches: true } as MediaQueryListEvent));

    expect(releasePointerCapture).toHaveBeenCalledWith(57);
    expect(surface).not.toHaveClass("is-pencil-dragging");
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).toHaveAttribute("data-tool-phase", "resting");
  });

  it("draws from page and grid gaps, then drops the held tool on a card", () => {
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

    pickTool("pencil");
    [surface, grid].forEach((target, index) => {
      dragFrom(target, surface, index + 10);
      expect(clearButton).toBeEnabled();
      fireEvent.click(clearButton);
      expect(clearButton).toBeDisabled();
    });

    const articlePointerDown = dispatchPointerEvent(article!, "pointerdown", {
      button: 0,
      clientX: 20,
      clientY: 20,
      pointerId: 12,
      pointerType: "mouse"
    });
    expect(articlePointerDown.defaultPrevented).toBe(false);
    fireEvent.pointerMove(surface, {
      buttons: 1,
      clientX: 25,
      clientY: 22,
      pointerId: 12,
      pointerType: "mouse"
    });
    expect(clearButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).not.toHaveAttribute("data-tool-phase", "held");
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
    pickTool("pencil", "pen");

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

  it("replays pencil and eraser operations in order after a resize", async () => {
    const { context, fillRect, renderEvents, stroke } = installCanvasContext();
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
    installPointerCapture(surface);

    pickTool("pencil");
    dragFrom(surface, surface, 61);
    await waitFor(() => expect(stroke).toHaveBeenCalled());

    pickTool("eraser");
    dragFrom(surface, surface, 62);
    await waitFor(() => expect(fillRect).toHaveBeenCalled());

    const strokeCountBeforeSecondLine = stroke.mock.calls.length;
    pickTool("pencil");
    dragFrom(surface, surface, 63);
    await waitFor(() => expect(stroke.mock.calls.length).toBeGreaterThan(strokeCountBeforeSecondLine));

    renderEvents.splice(0);
    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(renderEvents).toContain("destination-out"));

    const eraserIndex = renderEvents.indexOf("destination-out");
    expect(renderEvents.indexOf("stroke")).toBeGreaterThanOrEqual(0);
    expect(renderEvents.indexOf("stroke")).toBeLessThan(eraserIndex);
    expect(renderEvents.lastIndexOf("stroke")).toBeGreaterThan(eraserIndex);
    expect(fillRect).toHaveBeenCalled();
    expect(context.globalCompositeOperation).toBe("source-over");

    const fillCountBeforeClear = fillRect.mock.calls.length;
    const strokeCountBeforeClear = stroke.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "書き込みを消す" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "書き込みを消す" })).toBeDisabled());
    expect(fillRect).toHaveBeenCalledTimes(fillCountBeforeClear);
    expect(stroke).toHaveBeenCalledTimes(strokeCountBeforeClear);
  });

  it("drops a held tool without preventing the original UI click", () => {
    const onSelect = vi.fn();
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={onSelect}
      />
    );

    pickTool("pencil");
    const startButton = screen.getAllByRole("button", { name: "試験を始める" })[0];
    const pointerDown = dispatchPointerEvent(startButton, "pointerdown", {
      button: 0,
      clientX: 300,
      clientY: 300,
      pointerId: 70,
      pointerType: "mouse"
    });

    expect(pointerDown.defaultPrevented).toBe(false);
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).toHaveAttribute("data-tool-phase", "resting");
    fireEvent.click(startButton);
    expect(onSelect).toHaveBeenCalledWith(sampleExams[0]);
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
      screen.getByText("カードの非操作部分"),
      screen.getByText("明示的な除外領域")
    ];

    excludedTargets.forEach((target, index) => {
      pickTool("pencil");
      const pointerDown = dispatchPointerEvent(target, "pointerdown", {
        button: 0,
        clientX: 20,
        clientY: 20,
        pointerId: index + 18,
        pointerType: "mouse"
      });

      expect(pointerDown.defaultPrevented).toBe(false);
      expect(surface).not.toHaveClass("is-pencil-dragging");
      fireEvent.pointerMove(surface, {
        buttons: 1,
        clientX: 25,
        clientY: 22,
        pointerId: index + 18,
        pointerType: "mouse"
      });
      fireEvent.pointerUp(surface, { pointerId: index + 18, pointerType: "mouse" });
      expect(state).toHaveTextContent("empty");
    });

    dragFrom(surface, surface, 30, "touch");
    expect(state).toHaveTextContent("empty");
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it("prevents native dragstart and marks cover images as non-draggable", () => {
    render(
      <ExamList
        exams={sampleExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const cover = screen.getByLabelText(`${sampleExams[0].title}の表紙`);
    const coverImage = cover.querySelector("img");
    expect(coverImage).not.toBeNull();
    expect(coverImage).toHaveAttribute("draggable", "false");

    const dragStart = new Event("dragstart", { bubbles: true, cancelable: true });
    fireEvent(coverImage!, dragStart);
    expect(dragStart.defaultPrevented).toBe(true);
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
