import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEventHandler,
  type PointerEventHandler,
  type RefObject
} from "react";
import {
  DEFAULT_TOOL_SIZES,
  HELD_TOOL_LIFT,
  HELD_TOOL_ROTATIONS,
  REDUCED_MOTION_INITIAL_ROTATIONS,
  TOOL_CURSOR_OFFSETS,
  droppedToolPhysicsState,
  heldCenterFromContact,
  initialLandingCenters,
  interpolateAngleShortest,
  physicsDeltaSeconds,
  resolveRestingX,
  restingToolY,
  rootPointFromClient,
  stepToolPhysics,
  toolBoundsAt,
  type HomeDrawingToolKind,
  type HomeDrawingToolPhase,
  type Point2D,
  type ToolPhysicsState,
  type ToolSize
} from "../utils/homeToolPhysics";

const DRAG_START_DISTANCE = 3;
const GRAPHITE_COLOR = "58, 63, 61";
const PENCIL_DRAGGING_CLASS = "is-pencil-dragging";
const ERASER_FACE = { height: 16, width: 38 };
const TOOL_KINDS: HomeDrawingToolKind[] = ["pencil", "eraser"];
const INITIAL_FALL_ROTATIONS: Record<HomeDrawingToolKind, number> = { pencil: -18, eraser: 28 };
const UI_DROP_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "summary",
  "details",
  "header",
  "article",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']",
  "[data-pencil-drawing-exclusion]",
  "[data-home-tool-ui]"
].join(",");

interface PencilPoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

interface EraserSample {
  x: number;
  y: number;
  angle: number;
  time: number;
}

interface PencilOperation {
  kind: "pencil";
  points: PencilPoint[];
  seed: number;
}

interface EraserOperation {
  kind: "eraser";
  samples: EraserSample[];
  faceWidth: number;
  faceHeight: number;
}

type DrawingOperation = PencilOperation | EraserOperation;

interface ActiveGesture {
  pointerId: number;
  pointerType: string;
  startPoint: Point2D;
  drawing: boolean;
  operation: DrawingOperation;
}

interface LiftAnimation {
  kind: HomeDrawingToolKind;
  from: ToolPhysicsState;
  to: ToolPhysicsState;
  startTimestamp: number | null;
}

interface HomePencilDrawing {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  clearDrawing: () => void;
  hasDrawing: boolean;
  pickUpTool: (kind: HomeDrawingToolKind, point: Point2D) => void;
  pointerHandlers: {
    onDragStart: DragEventHandler<HTMLElement>;
    onLostPointerCapture: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
  };
  registerToolElement: (kind: HomeDrawingToolKind, element: HTMLButtonElement | null) => void;
  remeasureToolWorld: () => void;
  rootRef: RefObject<HTMLDivElement | null>;
  toolPhases: Record<HomeDrawingToolKind, HomeDrawingToolPhase>;
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

function drawOperation(context: CanvasRenderingContext2D, operation: DrawingOperation) {
  if (operation.kind === "pencil") {
    drawPencilOperation(context, operation);
    return;
  }

  drawEraserOperation(context, operation);
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

function isUiDropTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(UI_DROP_SELECTOR) !== null;
}

function initialPhysicsState(kind: HomeDrawingToolKind): ToolPhysicsState {
  return {
    x: 0,
    y: kind === "pencil" ? -112 : -64,
    vx: 0,
    vy: kind === "pencil" ? 0 : 40,
    rotation: INITIAL_FALL_ROTATIONS[kind],
    angularVelocity: kind === "pencil" ? 82 : -112,
    restingFrames: 0
  };
}

function interpolatePhysicsState(from: ToolPhysicsState, to: ToolPhysicsState, progress: number): ToolPhysicsState {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
    vx: 0,
    vy: 0,
    rotation: interpolateAngleShortest(from.rotation, to.rotation, progress),
    angularVelocity: 0,
    restingFrames: 0
  };
}

const INITIAL_TOOL_PHASES: Record<HomeDrawingToolKind, HomeDrawingToolPhase> = {
  pencil: "falling",
  eraser: "falling"
};

export function useHomePencilDrawing(): HomePencilDrawing {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const operationsRef = useRef<DrawingOperation[]>([]);
  const activeGestureRef = useRef<ActiveGesture | null>(null);
  const drawingAnimationFrameRef = useRef<number | null>(null);
  const physicsAnimationFrameRef = useRef<number | null>(null);
  const physicsLoopRef = useRef<FrameRequestCallback>(() => undefined);
  const lastPhysicsTimestampRef = useRef<number | null>(null);
  const liftAnimationRef = useRef<LiftAnimation | null>(null);
  const seedRef = useRef(1);
  const hasDrawingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const floorSizeRef = useRef({ height: 0, width: 0 });
  const heldToolRef = useRef<HomeDrawingToolKind | null>(null);
  const lastPointerRef = useRef<Point2D>({ x: 0, y: 0 });
  const toolElementsRef = useRef<Record<HomeDrawingToolKind, HTMLButtonElement | null>>({
    pencil: null,
    eraser: null
  });
  const toolSizesRef = useRef<Record<HomeDrawingToolKind, ToolSize>>({
    pencil: { ...DEFAULT_TOOL_SIZES.pencil },
    eraser: { ...DEFAULT_TOOL_SIZES.eraser }
  });
  const toolPhysicsRef = useRef<Record<HomeDrawingToolKind, ToolPhysicsState>>({
    pencil: initialPhysicsState("pencil"),
    eraser: initialPhysicsState("eraser")
  });
  const restingPreferenceXRef = useRef<Record<HomeDrawingToolKind, number | null>>({
    pencil: null,
    eraser: null
  });
  const toolPhasesRef = useRef<Record<HomeDrawingToolKind, HomeDrawingToolPhase>>(INITIAL_TOOL_PHASES);
  const [toolPhases, setToolPhases] = useState<Record<HomeDrawingToolKind, HomeDrawingToolPhase>>(
    INITIAL_TOOL_PHASES
  );
  const [hasDrawing, setHasDrawing] = useState(false);

  const setToolPhase = useCallback((kind: HomeDrawingToolKind, phase: HomeDrawingToolPhase) => {
    if (toolPhasesRef.current[kind] === phase) {
      return;
    }

    toolPhasesRef.current = { ...toolPhasesRef.current, [kind]: phase };
    setToolPhases(toolPhasesRef.current);
  }, []);

  const applyToolPose = useCallback((kind: HomeDrawingToolKind) => {
    const element = toolElementsRef.current[kind];
    if (!element) {
      return;
    }

    const phase = toolPhasesRef.current[kind];
    const pose = toolPhysicsRef.current[kind];
    element.style.position = phase === "held" || phase === "contact" || phase === "lifting" ? "fixed" : "absolute";
    element.style.left = `${pose.x}px`;
    element.style.top = `${pose.y}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${pose.rotation}deg)`;
  }, []);

  const registerToolElement = useCallback((kind: HomeDrawingToolKind, element: HTMLButtonElement | null) => {
    toolElementsRef.current[kind] = element;
    if (!element) {
      return;
    }

    toolSizesRef.current[kind] = {
      width: element.offsetWidth || DEFAULT_TOOL_SIZES[kind].width,
      height: element.offsetHeight || DEFAULT_TOOL_SIZES[kind].height
    };
  }, []);

  const renderDrawing = useCallback(() => {
    drawingAnimationFrameRef.current = null;
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
    context.globalCompositeOperation = "source-over";
    context.clearRect(0, 0, bounds.width, bounds.height);
    operationsRef.current.forEach((operation) => drawOperation(context, operation));
    const activeGesture = activeGestureRef.current;
    if (activeGesture?.drawing) {
      drawOperation(context, activeGesture.operation);
    }
    context.globalCompositeOperation = "source-over";
  }, []);

  const scheduleDrawing = useCallback(() => {
    if (drawingAnimationFrameRef.current !== null) {
      return;
    }

    if (typeof window.requestAnimationFrame === "function") {
      drawingAnimationFrameRef.current = window.requestAnimationFrame(renderDrawing);
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

  const restingOtherBounds = useCallback((kind: HomeDrawingToolKind) => {
    const otherKind = kind === "pencil" ? "eraser" : "pencil";
    if (toolPhasesRef.current[otherKind] !== "resting") {
      return null;
    }

    const otherState = toolPhysicsRef.current[otherKind];
    return toolBoundsAt(otherState.x, toolSizesRef.current[otherKind], otherState.rotation);
  }, []);

  const settleTool = useCallback(
    (kind: HomeDrawingToolKind) => {
      const floor = floorSizeRef.current;
      const size = toolSizesRef.current[kind];
      const rotation = toolPhysicsRef.current[kind].rotation;
      const requestedX = restingPreferenceXRef.current[kind] ?? toolPhysicsRef.current[kind].x;
      const x = resolveRestingX(requestedX, floor.width, size, rotation, restingOtherBounds(kind));
      restingPreferenceXRef.current[kind] = x;
      toolPhysicsRef.current[kind] = {
        x,
        y: restingToolY(kind, floor.height, size, rotation),
        vx: 0,
        vy: 0,
        rotation,
        angularVelocity: 0,
        restingFrames: 2
      };
      setToolPhase(kind, "resting");
      applyToolPose(kind);
    },
    [applyToolPose, restingOtherBounds, setToolPhase]
  );

  const finishLiftWithoutAnimation = useCallback(() => {
    const lift = liftAnimationRef.current;
    if (!lift) {
      return;
    }

    toolPhysicsRef.current[lift.kind] = lift.to;
    liftAnimationRef.current = null;
    setToolPhase(lift.kind, "held");
    applyToolPose(lift.kind);
  }, [applyToolPose, setToolPhase]);

  const schedulePhysics = useCallback(() => {
    if (physicsAnimationFrameRef.current !== null) {
      return;
    }

    if (typeof window.requestAnimationFrame !== "function") {
      TOOL_KINDS.forEach((kind) => {
        if (toolPhasesRef.current[kind] === "falling") {
          settleTool(kind);
        }
      });
      finishLiftWithoutAnimation();
      return;
    }

    physicsAnimationFrameRef.current = window.requestAnimationFrame((timestamp) => {
      physicsLoopRef.current(timestamp);
    });
  }, [finishLiftWithoutAnimation, settleTool]);

  physicsLoopRef.current = (timestamp) => {
    physicsAnimationFrameRef.current = null;
    const deltaSeconds = physicsDeltaSeconds(lastPhysicsTimestampRef.current, timestamp);
    lastPhysicsTimestampRef.current = timestamp;
    let shouldContinue = false;

    const lift = liftAnimationRef.current;
    if (lift) {
      const startTimestamp = lift.startTimestamp ?? timestamp;
      lift.startTimestamp = startTimestamp;
      const progress = Math.min(1, (timestamp - startTimestamp) / 120);
      toolPhysicsRef.current[lift.kind] = interpolatePhysicsState(lift.from, lift.to, progress);
      applyToolPose(lift.kind);
      if (progress >= 1) {
        liftAnimationRef.current = null;
        setToolPhase(lift.kind, "held");
      } else {
        shouldContinue = true;
      }
    }

    TOOL_KINDS.forEach((kind) => {
      if (toolPhasesRef.current[kind] !== "falling") {
        return;
      }

      const result = stepToolPhysics(
        kind,
        toolPhysicsRef.current[kind],
        toolSizesRef.current[kind],
        floorSizeRef.current.height,
        floorSizeRef.current.width,
        deltaSeconds
      );
      toolPhysicsRef.current[kind] = result.state;
      if (result.resting) {
        settleTool(kind);
        return;
      }

      applyToolPose(kind);
      shouldContinue = true;
    });

    if (shouldContinue) {
      schedulePhysics();
      return;
    }

    lastPhysicsTimestampRef.current = null;
  };

  const placeToolsOnFloor = useCallback(() => {
    const centers = initialLandingCenters(floorSizeRef.current.width, toolSizesRef.current);
    TOOL_KINDS.forEach((kind) => {
      const rotation = REDUCED_MOTION_INITIAL_ROTATIONS[kind];
      restingPreferenceXRef.current[kind] = centers[kind];
      toolPhysicsRef.current[kind] = {
        x: centers[kind],
        y: restingToolY(kind, floorSizeRef.current.height, toolSizesRef.current[kind], rotation),
        vx: 0,
        vy: 0,
        rotation,
        angularVelocity: 0,
        restingFrames: 2
      };
      setToolPhase(kind, "resting");
      applyToolPose(kind);
    });
  }, [applyToolPose, setToolPhase]);

  const measureToolWorld = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const bounds = root.getBoundingClientRect();
    const previousFloorHeight = floorSizeRef.current.height;
    const floorMovedDown = previousFloorHeight > 0 && bounds.height > previousFloorHeight + 1;
    floorSizeRef.current = { height: bounds.height, width: bounds.width };
    TOOL_KINDS.forEach((kind) => {
      const element = toolElementsRef.current[kind];
      if (element) {
        toolSizesRef.current[kind] = {
          width: element.offsetWidth || DEFAULT_TOOL_SIZES[kind].width,
          height: element.offsetHeight || DEFAULT_TOOL_SIZES[kind].height
        };
      }
    });

    const defaultCenters = initialLandingCenters(bounds.width, toolSizesRef.current);
    let restartedFalling = false;
    TOOL_KINDS.forEach((kind) => {
      if (toolPhasesRef.current[kind] !== "resting") {
        return;
      }

      restingPreferenceXRef.current[kind] = restingPreferenceXRef.current[kind] ?? defaultCenters[kind];
      if (floorMovedDown && !reducedMotionRef.current) {
        toolPhysicsRef.current[kind] = {
          ...toolPhysicsRef.current[kind],
          vx: 0,
          vy: 0,
          angularVelocity: 0,
          restingFrames: 0
        };
        setToolPhase(kind, "falling");
        applyToolPose(kind);
        restartedFalling = true;
        return;
      }

      settleTool(kind);
    });

    if (restartedFalling) {
      lastPhysicsTimestampRef.current = null;
      schedulePhysics();
    }
  }, [applyToolPose, schedulePhysics, setToolPhase, settleTool]);

  const initializeToolWorld = useCallback(() => {
    measureToolWorld();
    heldToolRef.current = null;
    liftAnimationRef.current = null;
    lastPhysicsTimestampRef.current = null;
    const centers = initialLandingCenters(
      floorSizeRef.current.width,
      toolSizesRef.current,
      INITIAL_FALL_ROTATIONS
    );
    restingPreferenceXRef.current = { pencil: centers.pencil, eraser: centers.eraser };

    if (reducedMotionRef.current || typeof window.requestAnimationFrame !== "function") {
      placeToolsOnFloor();
      return;
    }

    TOOL_KINDS.forEach((kind) => {
      const initialState = initialPhysicsState(kind);
      toolPhysicsRef.current[kind] = { ...initialState, x: centers[kind] };
      setToolPhase(kind, "falling");
      applyToolPose(kind);
    });
    schedulePhysics();
  }, [applyToolPose, measureToolWorld, placeToolsOnFloor, schedulePhysics, setToolPhase]);

  const dropHeldTool = useCallback(() => {
    const kind = heldToolRef.current;
    const root = rootRef.current;
    const element = kind ? toolElementsRef.current[kind] : null;
    if (!kind || !root || !element) {
      return;
    }

    const rootBounds = root.getBoundingClientRect();
    const elementBounds = element.getBoundingClientRect();
    const rootCenter = rootPointFromClient(
      { x: elementBounds.left + elementBounds.width / 2, y: elementBounds.top + elementBounds.height / 2 },
      rootBounds
    );
    heldToolRef.current = null;
    liftAnimationRef.current = null;
    restingPreferenceXRef.current[kind] = rootCenter.x;
    toolPhysicsRef.current[kind] = droppedToolPhysicsState(rootCenter, toolPhysicsRef.current[kind].rotation);
    setToolPhase(kind, "falling");
    applyToolPose(kind);
    lastPhysicsTimestampRef.current = null;

    if (reducedMotionRef.current) {
      settleTool(kind);
      return;
    }

    schedulePhysics();
  }, [applyToolPose, schedulePhysics, setToolPhase, settleTool]);

  const updateHeldToolPosition = useCallback(
    (kind: HomeDrawingToolKind, contactPoint: Point2D, isContact: boolean) => {
      const rotation = HELD_TOOL_ROTATIONS[kind];
      const cursorOffset = TOOL_CURSOR_OFFSETS[kind];
      const visibleContactPoint = {
        x: contactPoint.x + cursorOffset.x,
        y: contactPoint.y + cursorOffset.y - (isContact ? 0 : HELD_TOOL_LIFT)
      };
      const center = heldCenterFromContact(kind, visibleContactPoint, rotation, toolSizesRef.current[kind]);
      toolPhysicsRef.current[kind] = {
        x: center.x,
        y: center.y,
        vx: 0,
        vy: 0,
        rotation,
        angularVelocity: 0,
        restingFrames: 0
      };
      applyToolPose(kind);
    },
    [applyToolPose]
  );

  const pickUpTool = useCallback(
    (kind: HomeDrawingToolKind, point: Point2D) => {
      if (toolPhasesRef.current[kind] !== "resting") {
        return;
      }

      if (heldToolRef.current && heldToolRef.current !== kind) {
        dropHeldTool();
      }

      const element = toolElementsRef.current[kind];
      if (!element) {
        return;
      }

      const bounds = element.getBoundingClientRect();
      const from: ToolPhysicsState = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
        vx: 0,
        vy: 0,
        rotation: toolPhysicsRef.current[kind].rotation,
        angularVelocity: 0,
        restingFrames: 0
      };
      const targetCenter = heldCenterFromContact(
        kind,
        {
          x: point.x + TOOL_CURSOR_OFFSETS[kind].x,
          y: point.y + TOOL_CURSOR_OFFSETS[kind].y - HELD_TOOL_LIFT
        },
        HELD_TOOL_ROTATIONS[kind],
        toolSizesRef.current[kind]
      );
      const to: ToolPhysicsState = {
        ...from,
        x: targetCenter.x,
        y: targetCenter.y,
        rotation: HELD_TOOL_ROTATIONS[kind]
      };
      heldToolRef.current = kind;
      lastPointerRef.current = point;
      toolPhysicsRef.current[kind] = from;
      setToolPhase(kind, "lifting");
      applyToolPose(kind);

      if (reducedMotionRef.current || typeof window.requestAnimationFrame !== "function") {
        toolPhysicsRef.current[kind] = to;
        setToolPhase(kind, "held");
        applyToolPose(kind);
        return;
      }

      liftAnimationRef.current = { kind, from, to, startTimestamp: null };
      lastPhysicsTimestampRef.current = null;
      schedulePhysics();
    },
    [applyToolPose, dropHeldTool, schedulePhysics, setToolPhase]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const mediaQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    reducedMotionRef.current = mediaQuery?.matches ?? false;
    resizeCanvas();
    initializeToolWorld();

    const handleResize = () => {
      resizeCanvas();
      measureToolWorld();
      if (TOOL_KINDS.some((kind) => toolPhasesRef.current[kind] === "falling")) {
        schedulePhysics();
      }
    };
    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (!event.matches) {
        return;
      }

      const activeGesture = activeGestureRef.current;
      activeGestureRef.current = null;
      root.classList.remove(PENCIL_DRAGGING_CLASS);
      if (activeGesture?.drawing) {
        if (activeGesture.operation.kind === "pencil" || hasDrawingRef.current) {
          operationsRef.current.push(activeGesture.operation);
        }
        scheduleDrawing();
      }
      if (
        activeGesture &&
        typeof root.hasPointerCapture === "function" &&
        root.hasPointerCapture(activeGesture.pointerId)
      ) {
        root.releasePointerCapture(activeGesture.pointerId);
      }

      const physicsFrameId = physicsAnimationFrameRef.current;
      physicsAnimationFrameRef.current = null;
      if (physicsFrameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(physicsFrameId);
      }
      liftAnimationRef.current = null;
      heldToolRef.current = null;
      placeToolsOnFloor();
    };

    window.addEventListener("resize", handleResize);
    mediaQuery?.addEventListener?.("change", handleMotionChange);
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(root);
    let mounted = true;
    document.fonts?.ready.then(() => {
      if (mounted) {
        handleResize();
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      mediaQuery?.removeEventListener?.("change", handleMotionChange);
      resizeObserver?.disconnect();
      root.classList.remove(PENCIL_DRAGGING_CLASS);

      const activeGesture = activeGestureRef.current;
      if (
        activeGesture &&
        typeof root.hasPointerCapture === "function" &&
        root.hasPointerCapture(activeGesture.pointerId)
      ) {
        root.releasePointerCapture(activeGesture.pointerId);
      }
      activeGestureRef.current = null;
      heldToolRef.current = null;
      liftAnimationRef.current = null;
      lastPhysicsTimestampRef.current = null;

      const drawingFrameId = drawingAnimationFrameRef.current;
      drawingAnimationFrameRef.current = null;
      if (drawingFrameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(drawingFrameId);
      }

      const physicsFrameId = physicsAnimationFrameRef.current;
      physicsAnimationFrameRef.current = null;
      if (physicsFrameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(physicsFrameId);
      }
    };
  }, [
    initializeToolWorld,
    measureToolWorld,
    placeToolsOnFloor,
    resizeCanvas,
    scheduleDrawing,
    schedulePhysics
  ]);

  const finishGesture = useCallback(
    (pointerId: number, root: HTMLElement) => {
      const activeGesture = activeGestureRef.current;
      if (!activeGesture || activeGesture.pointerId !== pointerId) {
        return;
      }

      root.classList.remove(PENCIL_DRAGGING_CLASS);
      if (activeGesture.drawing) {
        if (activeGesture.operation.kind === "pencil") {
          operationsRef.current.push(activeGesture.operation);
        } else if (hasDrawingRef.current) {
          operationsRef.current.push(activeGesture.operation);
        }
      }
      activeGestureRef.current = null;

      if (typeof root.hasPointerCapture === "function" && root.hasPointerCapture(pointerId)) {
        root.releasePointerCapture(pointerId);
      }

      const heldTool = heldToolRef.current;
      if (heldTool) {
        setToolPhase(heldTool, "held");
        updateHeldToolPosition(heldTool, lastPointerRef.current, false);
      }
      scheduleDrawing();
    },
    [scheduleDrawing, setToolPhase, updateHeldToolPosition]
  );

  const onPointerDown = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if ((event.pointerType !== "mouse" && event.pointerType !== "pen") || event.button !== 0) {
        return;
      }

      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      if (isUiDropTarget(event.target)) {
        if (heldToolRef.current) {
          dropHeldTool();
        }
        return;
      }

      const heldTool = heldToolRef.current;
      if (!heldTool || toolPhasesRef.current[heldTool] === "lifting") {
        return;
      }

      event.preventDefault();
      window.getSelection()?.removeAllRanges();
      event.currentTarget.classList.add(PENCIL_DRAGGING_CLASS);
      const bounds = event.currentTarget.getBoundingClientRect();
      const point = rootPointFromClient({ x: event.clientX, y: event.clientY }, bounds);
      const operation: DrawingOperation =
        heldTool === "pencil"
          ? {
              kind: "pencil",
              points: [
                {
                  ...point,
                  pressure: event.pointerType === "pen" ? clamp(event.pressure, 0, 1) : 0.5,
                  time: event.timeStamp
                }
              ],
              seed: seedRef.current
            }
          : {
              kind: "eraser",
              samples: [{ ...point, angle: HELD_TOOL_ROTATIONS.eraser, time: event.timeStamp }],
              faceWidth: ERASER_FACE.width,
              faceHeight: ERASER_FACE.height
            };
      seedRef.current += 1;
      activeGestureRef.current = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startPoint: point,
        drawing: false,
        operation
      };
      setToolPhase(heldTool, "contact");
      updateHeldToolPosition(heldTool, lastPointerRef.current, true);
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [dropHeldTool, setToolPhase, updateHeldToolPosition]
  );

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      const heldTool = heldToolRef.current;
      const activeGesture = activeGestureRef.current;
      if (heldTool && toolPhasesRef.current[heldTool] !== "lifting") {
        updateHeldToolPosition(heldTool, lastPointerRef.current, activeGesture?.pointerId === event.pointerId);
      }

      if (!activeGesture || activeGesture.pointerId !== event.pointerId) {
        return;
      }

      if ((event.buttons & 1) === 0) {
        finishGesture(event.pointerId, event.currentTarget);
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const point = rootPointFromClient({ x: event.clientX, y: event.clientY }, bounds);
      const distanceFromStart = Math.hypot(
        point.x - activeGesture.startPoint.x,
        point.y - activeGesture.startPoint.y
      );
      if (!activeGesture.drawing && distanceFromStart < DRAG_START_DISTANCE) {
        return;
      }

      if (!activeGesture.drawing) {
        activeGesture.drawing = true;
        if (activeGesture.operation.kind === "pencil") {
          hasDrawingRef.current = true;
          setHasDrawing(true);
        }
      }

      event.preventDefault();
      if (activeGesture.operation.kind === "pencil") {
        const previous = activeGesture.operation.points[activeGesture.operation.points.length - 1];
        activeGesture.operation.points.push({
          ...point,
          pressure: pointerPressure(
            activeGesture.pointerType,
            event.pressure,
            previous,
            point.x,
            point.y,
            event.timeStamp
          ),
          time: event.timeStamp
        });
      } else {
        const previous = activeGesture.operation.samples[activeGesture.operation.samples.length - 1];
        if (Math.hypot(point.x - previous.x, point.y - previous.y) >= 1.5) {
          activeGesture.operation.samples.push({
            ...point,
            angle: HELD_TOOL_ROTATIONS.eraser,
            time: event.timeStamp
          });
        }
      }
      scheduleDrawing();
    },
    [finishGesture, scheduleDrawing, updateHeldToolPosition]
  );

  const onPointerUp = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishGesture(event.pointerId, event.currentTarget),
    [finishGesture]
  );

  const onPointerCancel = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishGesture(event.pointerId, event.currentTarget),
    [finishGesture]
  );

  const onLostPointerCapture = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishGesture(event.pointerId, event.currentTarget),
    [finishGesture]
  );

  const onDragStart = useCallback<DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
  }, []);

  const clearDrawing = useCallback(() => {
    const activeGesture = activeGestureRef.current;
    const root = rootRef.current;
    if (
      activeGesture &&
      root &&
      typeof root.hasPointerCapture === "function" &&
      root.hasPointerCapture(activeGesture.pointerId)
    ) {
      root.releasePointerCapture(activeGesture.pointerId);
    }
    operationsRef.current = [];
    activeGestureRef.current = null;
    hasDrawingRef.current = false;
    root?.classList.remove(PENCIL_DRAGGING_CLASS);
    setHasDrawing(false);
    const heldTool = heldToolRef.current;
    if (heldTool) {
      setToolPhase(heldTool, "held");
      updateHeldToolPosition(heldTool, lastPointerRef.current, false);
    }
    scheduleDrawing();
  }, [scheduleDrawing, setToolPhase, updateHeldToolPosition]);

  return {
    canvasRef,
    clearDrawing,
    hasDrawing,
    pickUpTool,
    pointerHandlers: {
      onDragStart,
      onLostPointerCapture,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp
    },
    registerToolElement,
    remeasureToolWorld: measureToolWorld,
    rootRef,
    toolPhases
  };
}
