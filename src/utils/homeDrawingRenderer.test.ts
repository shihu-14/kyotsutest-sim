import { describe, expect, it, vi } from "vitest";
import {
  drawingPressure,
  renderHomeDrawing,
  type DrawingOperation
} from "./homeDrawingRenderer";

function createContext() {
  const events: string[] = [];
  let compositeOperation = "source-over";
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(() => events.push("erase")),
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
    stroke: vi.fn(() => events.push("stroke")),
    strokeStyle: "#000",
    translate: vi.fn()
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(context, "globalCompositeOperation", {
    configurable: true,
    get: () => compositeOperation,
    set: (value: string) => {
      compositeOperation = value;
      events.push(value);
    }
  });
  return { context, events };
}

describe("homeDrawingRenderer", () => {
  it("replays pencil and eraser operations in their original order", () => {
    const { context, events } = createContext();
    const operations: DrawingOperation[] = [
      {
        kind: "pencil",
        points: [
          { x: 0, y: 0, pressure: 0.4, time: 0 },
          { x: 10, y: 10, pressure: 0.6, time: 16 }
        ],
        seed: 1
      },
      {
        kind: "eraser",
        samples: [
          { x: 4, y: 4, angle: 10, time: 20 },
          { x: 8, y: 8, angle: 10, time: 30 }
        ],
        faceWidth: 38,
        faceHeight: 16
      },
      {
        kind: "pencil",
        points: [
          { x: 20, y: 20, pressure: 0.5, time: 40 },
          { x: 30, y: 30, pressure: 0.5, time: 50 }
        ],
        seed: 2
      }
    ];

    renderHomeDrawing(context, 320, 240, operations);

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(events.indexOf("erase")).toBeGreaterThan(events.indexOf("stroke"));
    expect(events.lastIndexOf("stroke")).toBeGreaterThan(events.indexOf("erase"));
    expect(context.globalCompositeOperation).toBe("source-over");
  });

  it("uses pen pressure directly and derives mouse pressure from speed", () => {
    const previous = { x: 0, y: 0, pressure: 0.5, time: 0 };

    expect(drawingPressure("pen", 0.83, previous, 10, 0, 10)).toBe(0.83);
    expect(drawingPressure("pen", 2, previous, 10, 0, 10)).toBe(1);
    expect(drawingPressure("mouse", 0, previous, 1, 0, 10)).toBeGreaterThan(
      drawingPressure("mouse", 0, previous, 20, 0, 10)
    );
  });
});
