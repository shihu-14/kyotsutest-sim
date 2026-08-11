const GRAPHITE_COLOR = "58, 63, 61";

export interface PencilPoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

export interface EraserSample {
  x: number;
  y: number;
  angle: number;
  time: number;
}

export interface PencilOperation {
  kind: "pencil";
  points: PencilPoint[];
  seed: number;
}

export interface EraserOperation {
  kind: "eraser";
  samples: EraserSample[];
  faceWidth: number;
  faceHeight: number;
}

export type DrawingOperation = PencilOperation | EraserOperation;

export function clampDrawingPressure(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function deterministicNoise(seed: number, pointIndex: number, passIndex: number, axis: number) {
  const value = Math.sin(seed * 12.9898 + pointIndex * 78.233 + passIndex * 37.719 + axis * 19.913) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function smoothedPoint(points: PencilPoint[], index: number) {
  const current = points[index];
  if (index === 0 || index === points.length - 1) {
    return { x: current.x, y: current.y };
  }

  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];

  return {
    x: (previous.x + current.x * 2 + next.x) / 4,
    y: (previous.y + current.y * 2 + next.y) / 4
  };
}

function drawPencilOperation(context: CanvasRenderingContext2D, operation: PencilOperation) {
  if (operation.points.length < 2) {
    return;
  }

  const passes = [
    { alpha: 0.48, offset: 0.14, width: 0.82, dashed: false },
    { alpha: 0.12, offset: 0.42, width: 1.08, dashed: false },
    { alpha: 0.09, offset: 0.3, width: 0.72, dashed: true }
  ];

  context.globalCompositeOperation = "source-over";
  context.lineCap = "round";
  context.lineJoin = "round";

  passes.forEach((pass, passIndex) => {
    context.setLineDash(pass.dashed ? [0.8, 1.35] : []);
    context.lineDashOffset = pass.dashed ? deterministicNoise(operation.seed, 0, passIndex, 0) : 0;

    for (let index = 1; index < operation.points.length; index += 1) {
      const previous = operation.points[index - 1];
      const current = operation.points[index];
      const previousPosition = smoothedPoint(operation.points, index - 1);
      const currentPosition = smoothedPoint(operation.points, index);
      const previousOffsetX = deterministicNoise(operation.seed, index - 1, passIndex, 0) * pass.offset;
      const previousOffsetY = deterministicNoise(operation.seed, index - 1, passIndex, 1) * pass.offset;
      const currentOffsetX = deterministicNoise(operation.seed, index, passIndex, 0) * pass.offset;
      const currentOffsetY = deterministicNoise(operation.seed, index, passIndex, 1) * pass.offset;
      const pressure = (previous.pressure + current.pressure) / 2;

      context.beginPath();
      context.moveTo(previousPosition.x + previousOffsetX, previousPosition.y + previousOffsetY);
      context.lineTo(currentPosition.x + currentOffsetX, currentPosition.y + currentOffsetY);
      context.lineWidth = (0.64 + pressure * 1.46) * pass.width;
      context.strokeStyle = `rgba(${GRAPHITE_COLOR}, ${pass.alpha * (0.48 + pressure * 0.62)})`;
      context.stroke();
    }
  });

  context.setLineDash([]);
}

function stampEraser(context: CanvasRenderingContext2D, sample: EraserSample, operation: EraserOperation) {
  context.save();
  context.translate(sample.x, sample.y);
  context.rotate((sample.angle * Math.PI) / 180);
  context.fillRect(-operation.faceWidth / 2, -operation.faceHeight / 2, operation.faceWidth, operation.faceHeight);
  context.restore();
}

function drawEraserOperation(context: CanvasRenderingContext2D, operation: EraserOperation) {
  if (operation.samples.length < 2) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "destination-out";
  context.fillStyle = "rgba(0, 0, 0, 1)";
  const spacing = Math.max(1, Math.min(operation.faceWidth, operation.faceHeight) / 3);

  for (let index = 1; index < operation.samples.length; index += 1) {
    const previous = operation.samples[index - 1];
    const current = operation.samples[index];
    const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
    const steps = Math.max(1, Math.ceil(distance / spacing));

    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      stampEraser(
        context,
        {
          x: previous.x + (current.x - previous.x) * progress,
          y: previous.y + (current.y - previous.y) * progress,
          angle: previous.angle + (current.angle - previous.angle) * progress,
          time: previous.time + (current.time - previous.time) * progress
        },
        operation
      );
    }
  }

  context.restore();
  context.globalCompositeOperation = "source-over";
}

export function drawHomeDrawingOperation(context: CanvasRenderingContext2D, operation: DrawingOperation) {
  if (operation.kind === "pencil") {
    drawPencilOperation(context, operation);
    return;
  }

  drawEraserOperation(context, operation);
}

export function renderHomeDrawing(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  operations: readonly DrawingOperation[],
  activeOperation?: DrawingOperation
) {
  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, width, height);
  operations.forEach((operation) => drawHomeDrawingOperation(context, operation));
  if (activeOperation) {
    drawHomeDrawingOperation(context, activeOperation);
  }
  context.globalCompositeOperation = "source-over";
}

function mousePressure(previous: PencilPoint, nextX: number, nextY: number, nextTime: number) {
  const distance = Math.hypot(nextX - previous.x, nextY - previous.y);
  const elapsed = Math.max(1, nextTime - previous.time);
  const speed = distance / elapsed;
  return clampDrawingPressure(0.7 - speed * 0.17, 0.2, 0.68);
}

export function drawingPressure(
  pointerType: string,
  pressure: number,
  previous: PencilPoint,
  x: number,
  y: number,
  time: number
) {
  if (pointerType === "pen") {
    return clampDrawingPressure(pressure);
  }

  return mousePressure(previous, x, y, time);
}
