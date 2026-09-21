import { TOOL_CONTACT_ANCHORS, type HomeDrawingToolKind, type Point2D, type ToolSize } from "./homeToolPhysics";
import { fireEvent, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

export function installPointerCapture(element: HTMLElement) {
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

export function installCanvasContext() {
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

export function pickTool(kind: "pencil" | "eraser", pointerType = "mouse") {
  const label = kind === "pencil" ? "鉛筆を拾う" : "消しゴムを拾う";
  const tool = screen.getByRole("button", { name: label });
  expect(tool).toBeEnabled();
  fireEvent.pointerUp(tool, { clientX: 80, clientY: 80, pointerId: 1, pointerType });
  expect(tool).toHaveAttribute("data-tool-phase", "held");
  return tool;
}

export function dragFrom(target: Element, surface: HTMLElement, pointerId: number, pointerType = "mouse") {
  fireEvent.pointerDown(target, { button: 0, clientX: 20, clientY: 20, pointerId, pointerType });
  fireEvent.pointerMove(surface, { buttons: 1, clientX: 25, clientY: 22, pointerId, pointerType });
  fireEvent.pointerUp(surface, { clientX: 25, clientY: 22, pointerId, pointerType });
}

export function dispatchPointerEvent(target: Element, type: string, init: PointerEventInit) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, ...init });
  fireEvent(target, event);
  return event;
}

export function rotationFromTransform(element: HTMLElement) {
  return Number(element.style.transform.match(/rotate\((-?[\d.]+)deg\)/)?.[1]);
}

export function contactPointFromHeldCenter(
  kind: HomeDrawingToolKind,
  center: Point2D,
  rotation: number,
  size: ToolSize
): Point2D {
  const anchor = TOOL_CONTACT_ANCHORS[kind];
  const localOffset = {
    x: (anchor.x - 0.5) * size.width,
    y: (anchor.y - 0.5) * size.height
  };
  const radians = (rotation * Math.PI) / 180;

  return {
    x: center.x + localOffset.x * Math.cos(radians) - localOffset.y * Math.sin(radians),
    y: center.y + localOffset.x * Math.sin(radians) + localOffset.y * Math.cos(radians)
  };
}
