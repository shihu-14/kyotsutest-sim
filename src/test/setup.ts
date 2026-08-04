import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

beforeAll(() => {
  if (typeof window.PointerEvent !== "function") {
    class TestPointerEvent extends MouseEvent {
      pointerId: number;
      pointerType: string;
      pressure: number;

      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? "";
        this.pressure = init.pressure ?? 0;
      }
    }

    Object.defineProperty(window, "PointerEvent", { configurable: true, value: TestPointerEvent });
  }

  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    lineCap: "butt",
    lineDashOffset: 0,
    lineJoin: "miter",
    lineTo: vi.fn(),
    lineWidth: 1,
    moveTo: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: "#000"
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
});

afterEach(() => {
  cleanup();
});
