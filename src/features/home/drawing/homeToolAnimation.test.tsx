import { contactPointFromHeldCenter } from "./drawingTestUtils";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialExams } from "../../../data/exams/anime-onlymark-2026/exam";
import { ExamList } from "../ExamList";
import { installCanvasContext, installPointerCapture, pickTool, rotationFromTransform } from "./drawingTestUtils";
import { DEFAULT_TOOL_SIZES, HELD_TOOL_LIFT, HELD_TOOL_ROTATIONS, TOOL_CURSOR_OFFSETS } from "./homeToolPhysics";

describe("home tool animation", () => {
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
  it("preserves each resting angle when tool images load and the floor is remeasured", () => {
    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

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

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          motionChange = listener;
        },
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        removeEventListener: vi.fn()
      }))
    );
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        const frameId = ++nextFrameId;
        scheduledFrames.set(frameId, callback);
        return frameId;
      })
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((frameId: number) => scheduledFrames.delete(frameId))
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        disconnect() {}
        observe() {}
        unobserve() {}
      }
    );
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

    render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

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
      render(<ExamList exams={initialExams} onSelect={vi.fn()} />);

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
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        removeEventListener: vi.fn()
      }))
    );

    let unmount: (() => void) | undefined;

    try {
      const { stroke } = installCanvasContext();
      ({ unmount } = render(
        <StrictMode>
          <ExamList exams={initialExams} onSelect={vi.fn()} />
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
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        media: "(prefers-reduced-motion: reduce)",
        removeEventListener: vi.fn()
      }))
    );
    installCanvasContext();

    const { unmount } = render(
      <StrictMode>
        <ExamList exams={initialExams} onSelect={vi.fn()} />
      </StrictMode>
    );

    expect(requestAnimationFrame).toHaveBeenCalledTimes(4);
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    expect(scheduledFrames.size).toBe(2);

    unmount();
    expect(scheduledFrames.size).toBe(0);
  });
});
