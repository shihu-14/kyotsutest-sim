import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialExams } from "../../../data/exams/anime-onlymark-2026/exam";
import { ExamList } from "../ExamList";
import { HomeDrawingTools } from "./HomeDrawingTools";
import {
  dispatchPointerEvent,
  dragFrom,
  installCanvasContext,
  installPointerCapture,
  pickTool
} from "./drawingTestUtils";
import { useHomeDrawingSurface } from "./useHomeDrawingSurface";

function PencilExclusionHarness() {
  const { canvasRef, pickUpTool, pointerHandlers, registerToolElement, rootRef, toolPhases } = useHomeDrawingSurface();

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
      <HomeDrawingTools
        onPickTool={pickUpTool}
        onToolImageLoad={() => undefined}
        phases={toolPhases}
        registerToolElement={registerToolElement}
      />
    </div>
  );
}
describe("home drawing gestures", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        removeEventListener: vi.fn()
      }))
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("uses a full-page surface and preserves the threshold and capture behavior", async () => {
    const { clearRect, stroke } = installCanvasContext();
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

    const main = screen.getByRole("main");
    const surface = main.parentElement;
    expect(surface).toHaveClass("home-pencil-surface");
    if (!surface) {
      throw new Error("home pencil surface was not rendered");
    }

    const { releasePointerCapture, setPointerCapture } = installPointerCapture(surface);

    expect(surface.querySelector(":scope > .home-pencil-canvas")).toHaveAttribute("aria-hidden", "true");
    expect(surface.querySelector(":scope > main")).toBe(main);
    expect(surface.querySelector(":scope > .home-drawing-tool-layer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "書き込みを消す" })).not.toBeInTheDocument();

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
    expect(stroke).not.toHaveBeenCalled();
    fireEvent.pointerUp(surface, { clientX: 22, clientY: 20, pointerId: 7, pointerType: "mouse" });
    expect(releasePointerCapture).toHaveBeenCalledWith(7);

    fireEvent.pointerDown(surface, { button: 0, clientX: 20, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(setPointerCapture).toHaveBeenCalledWith(8);
    fireEvent.pointerMove(surface, { buttons: 1, clientX: 24, clientY: 20, pointerId: 8, pointerType: "mouse" });
    await waitFor(() => expect(stroke).toHaveBeenCalled());

    const strokeCountBeforePointerUp = stroke.mock.calls.length;
    fireEvent.pointerUp(surface, { clientX: 24, clientY: 20, pointerId: 8, pointerType: "mouse" });
    expect(releasePointerCapture).toHaveBeenCalledWith(8);
    await waitFor(() => expect(stroke.mock.calls.length).toBeGreaterThan(strokeCountBeforePointerUp));

    const clearCountBeforeResize = clearRect.mock.calls.length;
    const strokeCountBeforeResize = stroke.mock.calls.length;
    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(clearRect.mock.calls.length).toBeGreaterThan(clearCountBeforeResize));
    expect(stroke.mock.calls.length).toBeGreaterThan(strokeCountBeforeResize);
  });

  it("prevents selection on pointerdown and clears the dragging class on every finish path", () => {
    const { unmount } = render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

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
      expect(surface).toHaveClass("is-home-tool-contacting");

      dispatchPointerEvent(surface, finishEvent, {
        clientX: 20,
        clientY: 20,
        pointerId,
        pointerType: "mouse"
      });

      expect(surface).not.toHaveClass("is-home-tool-contacting");
    });

    const pointerDown = dispatchPointerEvent(surface, "pointerdown", {
      button: 0,
      clientX: 20,
      clientY: 20,
      pointerId: 54,
      pointerType: "mouse"
    });
    expect(pointerDown.defaultPrevented).toBe(true);
    expect(surface).toHaveClass("is-home-tool-contacting");

    unmount();
    expect(surface).not.toHaveClass("is-home-tool-contacting");
  });

  it("finishes an active gesture when reduced motion is enabled", () => {
    let handleMotionChange: ((event: MediaQueryListEvent) => void) | undefined;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          handleMotionChange = listener;
        },
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        removeEventListener: vi.fn()
      }))
    );
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

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
    expect(surface).toHaveClass("is-home-tool-contacting");

    act(() => handleMotionChange?.({ matches: true } as MediaQueryListEvent));

    expect(releasePointerCapture).toHaveBeenCalledWith(57);
    expect(surface).not.toHaveClass("is-home-tool-contacting");
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).toHaveAttribute("data-tool-phase", "resting");
  });

  it("draws from page and grid gaps, then drops the held tool on a card", () => {
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

    const surface = screen.getByRole("main").parentElement;
    if (!surface) {
      throw new Error("home pencil surface was not rendered");
    }

    installPointerCapture(surface);
    const grid = screen.getByRole("region", { name: "公開中の試験一覧" });
    const article = screen.getByRole("article", { name: initialExams[0].title });

    pickTool("pencil");
    [surface, grid].forEach((target, index) => {
      dragFrom(target, surface, index + 10);
      expect(screen.getByRole("button", { name: "鉛筆を拾う" })).toHaveAttribute("data-tool-phase", "held");
    });

    const articlePointerDown = dispatchPointerEvent(article, "pointerdown", {
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
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).not.toHaveAttribute("data-tool-phase", "held");
  });

  it("captures pen input on pointerdown and draws only after the threshold", async () => {
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

    const surface = screen.getByRole("main").parentElement;
    if (!surface) {
      throw new Error("home pencil surface was not rendered");
    }

    const { stroke } = installCanvasContext();
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
    expect(stroke).not.toHaveBeenCalled();

    fireEvent.pointerMove(surface, {
      buttons: 1,
      clientX: 14,
      clientY: 12,
      pointerId: 5,
      pointerType: "pen",
      pressure: 0.8
    });

    await waitFor(() => expect(stroke).toHaveBeenCalled());
  });

  it("replays pencil and eraser operations in order after a resize", async () => {
    const { context, fillRect, renderEvents, stroke } = installCanvasContext();
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

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
    expect(fillRect).toHaveBeenCalledWith(-19, -8, 38, 16);

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
  });

  it("drops a held tool without preventing the original UI click", () => {
    const onSelect = vi.fn();
    render(<ExamList exams={initialExams} onSelect={onSelect} />);

    pickTool("pencil");
    const selectButton = screen.getByRole("button", { name: `${initialExams[0].title}を選択` });
    const pointerDown = dispatchPointerEvent(selectButton, "pointerdown", {
      button: 0,
      clientX: 300,
      clientY: 300,
      pointerId: 70,
      pointerType: "mouse"
    });

    expect(pointerDown.defaultPrevented).toBe(false);
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).toHaveAttribute("data-tool-phase", "resting");
    fireEvent.click(selectButton);
    expect(onSelect).toHaveBeenCalledWith(initialExams[0]);
  });

  it("does not capture or draw from buttons, links, summaries, explicit exclusions, or touch", () => {
    const { stroke } = installCanvasContext();
    render(<PencilExclusionHarness />);

    const surface = document.querySelector<HTMLElement>(".pencil-exclusion-harness");
    if (!surface) {
      throw new Error("pencil exclusion harness was not rendered");
    }

    const { setPointerCapture } = installPointerCapture(surface);
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
      expect(surface).not.toHaveClass("is-home-tool-contacting");
      fireEvent.pointerMove(surface, {
        buttons: 1,
        clientX: 25,
        clientY: 22,
        pointerId: index + 18,
        pointerType: "mouse"
      });
      fireEvent.pointerUp(surface, { pointerId: index + 18, pointerType: "mouse" });
      expect(stroke).not.toHaveBeenCalled();
    });

    dragFrom(surface, surface, 30, "touch");
    expect(stroke).not.toHaveBeenCalled();
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it("prevents native dragstart and marks cover images as non-draggable", () => {
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

    const cover = screen.getByLabelText(`${initialExams[0].title}の表紙`);
    const coverImage = cover.querySelector("img");
    expect(coverImage).not.toBeNull();
    expect(coverImage).toHaveAttribute("draggable", "false");

    const dragStart = new Event("dragstart", { bubbles: true, cancelable: true });
    fireEvent(coverImage!, dragStart);
    expect(dragStart.defaultPrevented).toBe(true);
  });
});
