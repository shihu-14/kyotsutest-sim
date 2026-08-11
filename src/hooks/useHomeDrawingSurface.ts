import { useCallback, useEffect, useRef, type DragEventHandler, type PointerEventHandler, type RefObject } from "react";
import {
  clampDrawingPressure,
  drawingPressure,
  renderHomeDrawing,
  type DrawingOperation
} from "../utils/homeDrawingRenderer";
import {
  HELD_TOOL_ROTATIONS,
  rootPointFromClient,
  type HomeDrawingToolKind,
  type HomeDrawingToolPhase,
  type Point2D
} from "../utils/homeToolPhysics";
import { useHomeToolWorld } from "./useHomeToolWorld";

const DRAG_START_DISTANCE = 3;
const HOME_TOOL_CONTACT_CLASS = "is-home-tool-contacting";
const ERASER_FACE = { height: 16, width: 38 };
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

interface ActiveGesture {
  pointerId: number;
  pointerType: string;
  startPoint: Point2D;
  drawing: boolean;
  operation: DrawingOperation;
}

interface HomeDrawingSurfaceApi {
  canvasRef: RefObject<HTMLCanvasElement | null>;
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

function isUiDropTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(UI_DROP_SELECTOR) !== null;
}

export function useHomeDrawingSurface(): HomeDrawingSurfaceApi {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const operationsRef = useRef<DrawingOperation[]>([]);
  const activeGestureRef = useRef<ActiveGesture | null>(null);
  const drawingAnimationFrameRef = useRef<number | null>(null);
  const seedRef = useRef(1);
  const hasDrawingRef = useRef(false);
  const {
    disposeToolWorld,
    dropHeldTool,
    ensureFallingToolsScheduled,
    getHeldTool,
    getToolPhase,
    initializeToolWorld,
    pickUpTool,
    registerToolElement,
    rememberPointer,
    remeasureToolWorld,
    setHeldToolContact,
    setReducedMotionPreference,
    settleForReducedMotion,
    toolPhases,
    updateHeldPointer
  } = useHomeToolWorld(rootRef);

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
    const activeGesture = activeGestureRef.current;
    renderHomeDrawing(
      context,
      bounds.width,
      bounds.height,
      operationsRef.current,
      activeGesture?.drawing ? activeGesture.operation : undefined
    );
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const mediaQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    setReducedMotionPreference(mediaQuery?.matches ?? false);
    resizeCanvas();
    initializeToolWorld();

    const handleResize = () => {
      resizeCanvas();
      remeasureToolWorld();
      ensureFallingToolsScheduled();
    };
    const handleMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotionPreference(event.matches);
      if (!event.matches) {
        return;
      }

      const activeGesture = activeGestureRef.current;
      activeGestureRef.current = null;
      root.classList.remove(HOME_TOOL_CONTACT_CLASS);
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

      settleForReducedMotion();
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
      root.classList.remove(HOME_TOOL_CONTACT_CLASS);

      const activeGesture = activeGestureRef.current;
      if (
        activeGesture &&
        typeof root.hasPointerCapture === "function" &&
        root.hasPointerCapture(activeGesture.pointerId)
      ) {
        root.releasePointerCapture(activeGesture.pointerId);
      }
      activeGestureRef.current = null;
      disposeToolWorld();

      const drawingFrameId = drawingAnimationFrameRef.current;
      drawingAnimationFrameRef.current = null;
      if (drawingFrameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(drawingFrameId);
      }
    };
  }, [
    disposeToolWorld,
    ensureFallingToolsScheduled,
    initializeToolWorld,
    remeasureToolWorld,
    resizeCanvas,
    scheduleDrawing,
    setReducedMotionPreference,
    settleForReducedMotion
  ]);

  const finishGesture = useCallback(
    (pointerId: number, root: HTMLElement) => {
      const activeGesture = activeGestureRef.current;
      if (!activeGesture || activeGesture.pointerId !== pointerId) {
        return;
      }

      root.classList.remove(HOME_TOOL_CONTACT_CLASS);
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

      setHeldToolContact(false);
      scheduleDrawing();
    },
    [scheduleDrawing, setHeldToolContact]
  );

  const onPointerDown = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if ((event.pointerType !== "mouse" && event.pointerType !== "pen") || event.button !== 0) {
        return;
      }

      rememberPointer({ x: event.clientX, y: event.clientY });
      if (isUiDropTarget(event.target)) {
        if (getHeldTool()) {
          dropHeldTool();
        }
        return;
      }

      const heldTool = getHeldTool();
      if (!heldTool || getToolPhase(heldTool) === "lifting") {
        return;
      }

      event.preventDefault();
      window.getSelection()?.removeAllRanges();
      event.currentTarget.classList.add(HOME_TOOL_CONTACT_CLASS);
      const bounds = event.currentTarget.getBoundingClientRect();
      const point = rootPointFromClient({ x: event.clientX, y: event.clientY }, bounds);
      const operation: DrawingOperation =
        heldTool === "pencil"
          ? {
              kind: "pencil",
              points: [
                {
                  ...point,
                  pressure: event.pointerType === "pen" ? clampDrawingPressure(event.pressure) : 0.5,
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
      setHeldToolContact(true);
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [dropHeldTool, getHeldTool, getToolPhase, rememberPointer, setHeldToolContact]
  );

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      const activeGesture = activeGestureRef.current;
      updateHeldPointer({ x: event.clientX, y: event.clientY }, activeGesture?.pointerId === event.pointerId);

      if (!activeGesture || activeGesture.pointerId !== event.pointerId) {
        return;
      }

      if ((event.buttons & 1) === 0) {
        finishGesture(event.pointerId, event.currentTarget);
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const point = rootPointFromClient({ x: event.clientX, y: event.clientY }, bounds);
      const distanceFromStart = Math.hypot(point.x - activeGesture.startPoint.x, point.y - activeGesture.startPoint.y);
      if (!activeGesture.drawing && distanceFromStart < DRAG_START_DISTANCE) {
        return;
      }

      if (!activeGesture.drawing) {
        activeGesture.drawing = true;
        if (activeGesture.operation.kind === "pencil") {
          hasDrawingRef.current = true;
        }
      }

      event.preventDefault();
      if (activeGesture.operation.kind === "pencil") {
        const previous = activeGesture.operation.points[activeGesture.operation.points.length - 1];
        activeGesture.operation.points.push({
          ...point,
          pressure: drawingPressure(
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
    [finishGesture, scheduleDrawing, updateHeldPointer]
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

  return {
    canvasRef,
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
    remeasureToolWorld,
    rootRef,
    toolPhases
  };
}
