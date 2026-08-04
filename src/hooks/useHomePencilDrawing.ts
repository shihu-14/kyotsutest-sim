import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEventHandler,
  type PointerEventHandler,
  type RefObject
} from "react";

const DRAG_START_DISTANCE = 3;
const GRAPHITE_COLOR = "58, 63, 61";
const PENCIL_DRAGGING_CLASS = "is-pencil-dragging";
const DRAWING_EXCLUSION_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "summary",
  "details",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']",
  "[data-pencil-drawing-exclusion]"
].join(",");

interface PencilPoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

interface PencilStroke {
  points: PencilPoint[];
  seed: number;
}

interface ActiveStroke extends PencilStroke {
  pointerId: number;
  pointerType: string;
  startPoint: PencilPoint;
  drawing: boolean;
}

interface HomePencilDrawing {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  clearDrawing: () => void;
  hasDrawing: boolean;
  pointerHandlers: {
    onDragStart: DragEventHandler<HTMLElement>;
    onLostPointerCapture: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
  };
  rootRef: RefObject<HTMLDivElement | null>;
}

function clamp(value: number, minimum: number, maximum: number) {
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

function drawStroke(context: CanvasRenderingContext2D, stroke: PencilStroke) {
  if (stroke.points.length < 2) {
    return;
  }

  const passes = [
    { alpha: 0.48, offset: 0.14, width: 0.82, dashed: false },
    { alpha: 0.12, offset: 0.42, width: 1.08, dashed: false },
    { alpha: 0.09, offset: 0.3, width: 0.72, dashed: true }
  ];

  context.lineCap = "round";
  context.lineJoin = "round";

  passes.forEach((pass, passIndex) => {
    context.setLineDash(pass.dashed ? [0.8, 1.35] : []);
    context.lineDashOffset = pass.dashed ? deterministicNoise(stroke.seed, 0, passIndex, 0) : 0;

    for (let index = 1; index < stroke.points.length; index += 1) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      const previousPosition = smoothedPoint(stroke.points, index - 1);
      const currentPosition = smoothedPoint(stroke.points, index);
      const previousOffsetX = deterministicNoise(stroke.seed, index - 1, passIndex, 0) * pass.offset;
      const previousOffsetY = deterministicNoise(stroke.seed, index - 1, passIndex, 1) * pass.offset;
      const currentOffsetX = deterministicNoise(stroke.seed, index, passIndex, 0) * pass.offset;
      const currentOffsetY = deterministicNoise(stroke.seed, index, passIndex, 1) * pass.offset;
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

function mousePressure(previous: PencilPoint, nextX: number, nextY: number, nextTime: number) {
  const distance = Math.hypot(nextX - previous.x, nextY - previous.y);
  const elapsed = Math.max(1, nextTime - previous.time);
  const speed = distance / elapsed;
  return clamp(0.7 - speed * 0.17, 0.2, 0.68);
}

function pointerPressure(pointerType: string, pressure: number, previous: PencilPoint, x: number, y: number, time: number) {
  if (pointerType === "pen") {
    return clamp(pressure, 0, 1);
  }

  return mousePressure(previous, x, y, time);
}

function isDrawingExcluded(target: EventTarget | null) {
  return target instanceof Element && target.closest(DRAWING_EXCLUSION_SELECTOR) !== null;
}

export function useHomePencilDrawing(): HomePencilDrawing {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<PencilStroke[]>([]);
  const activeStrokeRef = useRef<ActiveStroke | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const seedRef = useRef(1);
  const [hasDrawing, setHasDrawing] = useState(false);

  const renderDrawing = useCallback(() => {
    animationFrameRef.current = null;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const bounds = root.getBoundingClientRect();
    context.clearRect(0, 0, bounds.width, bounds.height);
    strokesRef.current.forEach((stroke) => drawStroke(context, stroke));
    const activeStroke = activeStrokeRef.current;
    if (activeStroke?.drawing) {
      drawStroke(context, activeStroke);
    }
  }, []);

  const scheduleDrawing = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    if (typeof window.requestAnimationFrame === "function") {
      animationFrameRef.current = window.requestAnimationFrame(renderDrawing);
      return;
    }

    renderDrawing();
  }, [renderDrawing]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) {
      return;
    }

    const bounds = root.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(bounds.width * ratio));
    const pixelHeight = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const context = canvas.getContext("2d");
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    scheduleDrawing();
  }, [scheduleDrawing]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resizeCanvas) : null;
    const root = rootRef.current;
    if (root) {
      resizeObserver?.observe(root);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver?.disconnect();
      root?.classList.remove(PENCIL_DRAGGING_CLASS);
      const frameId = animationFrameRef.current;
      animationFrameRef.current = null;
      if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [resizeCanvas]);

  const finishStroke = useCallback(
    (pointerId: number, root: HTMLElement) => {
      const activeStroke = activeStrokeRef.current;
      if (!activeStroke || activeStroke.pointerId !== pointerId) {
        return;
      }

      root.classList.remove(PENCIL_DRAGGING_CLASS);
      if (activeStroke.drawing && activeStroke.points.length > 1) {
        strokesRef.current.push({ points: activeStroke.points, seed: activeStroke.seed });
      }
      activeStrokeRef.current = null;

      if (typeof root.hasPointerCapture === "function" && root.hasPointerCapture(pointerId)) {
        root.releasePointerCapture(pointerId);
      }
      scheduleDrawing();
    },
    [scheduleDrawing]
  );

  const onPointerDown = useCallback<PointerEventHandler<HTMLElement>>((event) => {
    if (
      (event.pointerType !== "mouse" && event.pointerType !== "pen") ||
      event.button !== 0 ||
      isDrawingExcluded(event.target)
    ) {
      return;
    }

    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    event.currentTarget.classList.add(PENCIL_DRAGGING_CLASS);
    const bounds = event.currentTarget.getBoundingClientRect();
    const startPoint: PencilPoint = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      pressure: event.pointerType === "pen" ? clamp(event.pressure, 0, 1) : 0.5,
      time: event.timeStamp
    };

    activeStrokeRef.current = {
      drawing: false,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      points: [startPoint],
      seed: seedRef.current,
      startPoint
    };
    seedRef.current += 1;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }, []);

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      const activeStroke = activeStrokeRef.current;
      if (!activeStroke || activeStroke.pointerId !== event.pointerId) {
        return;
      }

      if ((event.buttons & 1) === 0) {
        finishStroke(event.pointerId, event.currentTarget);
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const distanceFromStart = Math.hypot(x - activeStroke.startPoint.x, y - activeStroke.startPoint.y);

      if (!activeStroke.drawing && distanceFromStart < DRAG_START_DISTANCE) {
        return;
      }

      if (!activeStroke.drawing) {
        activeStroke.drawing = true;
        setHasDrawing(true);
      }

      event.preventDefault();
      const previous = activeStroke.points[activeStroke.points.length - 1];
      activeStroke.points.push({
        x,
        y,
        pressure: pointerPressure(activeStroke.pointerType, event.pressure, previous, x, y, event.timeStamp),
        time: event.timeStamp
      });
      scheduleDrawing();
    },
    [finishStroke, scheduleDrawing]
  );

  const onPointerUp = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishStroke(event.pointerId, event.currentTarget),
    [finishStroke]
  );

  const onPointerCancel = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishStroke(event.pointerId, event.currentTarget),
    [finishStroke]
  );

  const onLostPointerCapture = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishStroke(event.pointerId, event.currentTarget),
    [finishStroke]
  );

  const onDragStart = useCallback<DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
  }, []);

  const clearDrawing = useCallback(() => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    rootRef.current?.classList.remove(PENCIL_DRAGGING_CLASS);
    setHasDrawing(false);
    scheduleDrawing();
  }, [scheduleDrawing]);

  return {
    canvasRef,
    clearDrawing,
    hasDrawing,
    pointerHandlers: {
      onDragStart,
      onLostPointerCapture,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp
    },
    rootRef
  };
}
