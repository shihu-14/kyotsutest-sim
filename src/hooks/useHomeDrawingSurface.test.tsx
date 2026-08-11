import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialExams } from "../data/initialExams";
import { useHomeDrawingSurface } from "./useHomeDrawingSurface";
import {
  DEFAULT_TOOL_SIZES,
  HELD_TOOL_LIFT,
  HELD_TOOL_ROTATIONS,
  TOOL_CURSOR_OFFSETS,
  contactPointFromHeldCenter
} from "../utils/homeToolPhysics";
import { ExamList } from "../components/home/ExamList";
import { HomeDrawingTools } from "../components/home/HomeDrawingTools";

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

function rotationFromTransform(element: HTMLElement) {
  return Number(element.style.transform.match(/rotate\((-?[\d.]+)deg\)/)?.[1]);
}

function PencilExclusionHarness() {
  const {
    canvasRef,
    pickUpTool,
    pointerHandlers,
    registerToolElement,
    rootRef,
    toolPhases
  } = useHomeDrawingSurface();

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

describe("useHomeDrawingSurface", () => {
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

  it("preserves each resting angle when tool images load and the floor is remeasured", () => {
    render(
      <ExamList
        exams={initialExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    ["鉛筆を拾う", "消しゴムを拾う"].forEach((label) => {
      const tool = screen.getByRole("button", { name: label });
      const image = tool.querySelector("img");
      const restingTransform = tool.style.transform;

      expect(image).not.toBeNull();
      fireEvent.load(image!);
      fireEvent(window, new Event("resize"));

      expect(tool).toHaveAttribute("data-tool-phase", "resting");
      expect(tool.style.transform).toBe(restingTransform);
    });
  });

  it("drops resting tools to a newly extended page floor", () => {
    let floorHeight = 1000;
    let motionChange: ((event: MediaQueryListEvent) => void) | undefined;
    let resizeCallback: ResizeObserverCallback | undefined;
    const scheduledFrames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    let timestamp = 0;
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    vi.stubGlobal("matchMedia", vi.fn(() => ({
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        motionChange = listener;
      },
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn()
    })));
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      const frameId = ++nextFrameId;
      scheduledFrames.set(frameId, callback);
      return frameId;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((frameId: number) => scheduledFrames.delete(frameId)));
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      disconnect() {}
      observe() {}
      unobserve() {}
    });
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.classList.contains("home-pencil-surface")) {
          return {
            bottom: floorHeight,
            height: floorHeight,
            left: 0,
            right: 1280,
            top: 0,
            width: 1280,
            x: 0,
            y: 0,
            toJSON: () => ({})
          } as DOMRect;
        }
        return originalGetBoundingClientRect.call(this);
      });

    render(
      <ExamList
        exams={initialExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const pencil = screen.getByRole("button", { name: "鉛筆を拾う" });
    const eraser = screen.getByRole("button", { name: "消しゴムを拾う" });
    const pencilTopBefore = Number.parseFloat(pencil.style.top);
    const eraserTopBefore = Number.parseFloat(eraser.style.top);

    act(() => motionChange?.({ matches: false } as MediaQueryListEvent));
    floorHeight = 1240;
    act(() => resizeCallback?.([], {} as ResizeObserver));

    expect(pencil).toHaveAttribute("data-tool-phase", "falling");
    expect(eraser).toHaveAttribute("data-tool-phase", "falling");
    expect(Number.parseFloat(pencil.style.top)).toBeCloseTo(pencilTopBefore);
    expect(Number.parseFloat(eraser.style.top)).toBeCloseTo(eraserTopBefore);

    for (
      let frame = 0;
      frame < 600 && (pencil.dataset.toolPhase !== "resting" || eraser.dataset.toolPhase !== "resting");
      frame += 1
    ) {
      const callbacks = [...scheduledFrames.values()];
      scheduledFrames.clear();
      timestamp += 16;
      act(() => callbacks.forEach((callback) => callback(timestamp)));
    }

    expect(pencil).toHaveAttribute("data-tool-phase", "resting");
    expect(eraser).toHaveAttribute("data-tool-phase", "resting");
    expect(Number.parseFloat(pencil.style.top)).toBeGreaterThan(pencilTopBefore + 200);
    expect(Number.parseFloat(eraser.style.top)).toBeGreaterThan(eraserTopBefore + 200);
    getBoundingClientRectSpy.mockRestore();
  });

  it.each(["pencil", "eraser"] as const)(
    "uses one right-handed angle for held and contact %s poses, separated only by height",
    (kind) => {
      render(
        <ExamList
          exams={initialExams}
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
      const tool = screen.getByRole("button", {
        name: kind === "pencil" ? "鉛筆を拾う" : "消しゴムを拾う"
      });
      const restingRotation = rotationFromTransform(tool);

      pickTool(kind);
      fireEvent.pointerMove(surface, {
        buttons: 0,
        clientX: 80,
        clientY: 80,
        pointerId: 91,
        pointerType: "mouse"
      });
      const heldRotation = rotationFromTransform(tool);
      const heldLeft = Number.parseFloat(tool.style.left);
      const heldTop = Number.parseFloat(tool.style.top);
      const heldContactPoint = contactPointFromHeldCenter(
        kind,
        { x: heldLeft, y: heldTop },
        heldRotation,
        DEFAULT_TOOL_SIZES[kind]
      );

      expect(restingRotation).not.toBe(HELD_TOOL_ROTATIONS[kind]);
      expect(heldRotation).toBe(HELD_TOOL_ROTATIONS[kind]);
      expect(heldContactPoint.x).toBeCloseTo(80 + TOOL_CURSOR_OFFSETS[kind].x);
      expect(heldContactPoint.y).toBeCloseTo(80 + TOOL_CURSOR_OFFSETS[kind].y - HELD_TOOL_LIFT);

      fireEvent.pointerDown(surface, {
        button: 0,
        clientX: 80,
        clientY: 80,
        pointerId: 91,
        pointerType: "mouse"
      });
      const contactRotation = rotationFromTransform(tool);
      const contactLeft = Number.parseFloat(tool.style.left);
      const contactTop = Number.parseFloat(tool.style.top);
      const contactPoint = contactPointFromHeldCenter(
        kind,
        { x: contactLeft, y: contactTop },
        contactRotation,
        DEFAULT_TOOL_SIZES[kind]
      );

      expect(contactRotation).toBe(heldRotation);
      expect(contactLeft).toBeCloseTo(heldLeft);
      expect(contactTop - heldTop).toBeCloseTo(HELD_TOOL_LIFT);
      expect(contactPoint.x).toBeCloseTo(80 + TOOL_CURSOR_OFFSETS[kind].x);
      expect(contactPoint.y).toBeCloseTo(80 + TOOL_CURSOR_OFFSETS[kind].y);

      fireEvent.pointerUp(surface, {
        clientX: 80,
        clientY: 80,
        pointerId: 91,
        pointerType: "mouse"
      });
      expect(rotationFromTransform(tool)).toBe(heldRotation);
      expect(Number.parseFloat(tool.style.top)).toBeCloseTo(heldTop);

      const leftBeforeFollow = tool.style.left;
      fireEvent.pointerMove(surface, {
        buttons: 0,
        clientX: 120,
        clientY: 100,
        pointerId: 92,
        pointerType: "mouse"
      });
      expect(tool).toHaveAttribute("data-tool-phase", "held");
      expect(tool.style.left).not.toBe(leftBeforeFollow);
    }
  );

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
            exams={initialExams}
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
          exams={initialExams}
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

  it("uses a full-page surface and preserves the threshold and capture behavior", async () => {
    const { clearRect, stroke } = installCanvasContext();
    render(
      <ExamList
        exams={initialExams}
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
    const { unmount } = render(
      <ExamList
        exams={initialExams}
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
        exams={initialExams}
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
    expect(surface).toHaveClass("is-home-tool-contacting");

    act(() => handleMotionChange?.({ matches: true } as MediaQueryListEvent));

    expect(releasePointerCapture).toHaveBeenCalledWith(57);
    expect(surface).not.toHaveClass("is-home-tool-contacting");
    expect(screen.getByRole("button", { name: "鉛筆を拾う" })).toHaveAttribute("data-tool-phase", "resting");
  });

  it("draws from page and grid gaps, then drops the held tool on a card", () => {
    render(
      <ExamList
        exams={initialExams}
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
    render(
      <ExamList
        exams={initialExams}
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
    render(
      <ExamList
        exams={initialExams}
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
    render(
      <ExamList
        exams={initialExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={onSelect}
      />
    );

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
    render(
      <ExamList
        exams={initialExams}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenEditor={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    const cover = screen.getByLabelText(`${initialExams[0].title}の表紙`);
    const coverImage = cover.querySelector("img");
    expect(coverImage).not.toBeNull();
    expect(coverImage).toHaveAttribute("draggable", "false");

    const dragStart = new Event("dragstart", { bubbles: true, cancelable: true });
    fireEvent(coverImage!, dragStart);
    expect(dragStart.defaultPrevented).toBe(true);
  });

});
