import { useCallback, useRef, type DragEventHandler, type PointerEventHandler, type RefObject } from "react";
import { clampDrawingPressure, drawingPressure, type DrawingOperation } from "./homeDrawingRenderer";
import { HELD_TOOL_ROTATIONS, rootPointFromClient, type Point2D } from "./homeToolPhysics";
import type { useDrawingCanvas } from "./useDrawingCanvas";
import type { useHomeToolWorld } from "./useHomeToolWorld";

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

function isUiDropTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(UI_DROP_SELECTOR) !== null;
}

export function useDrawingGesture(
  rootRef: RefObject<HTMLDivElement | null>,
  world: ReturnType<typeof useHomeToolWorld>,
  canvas: ReturnType<typeof useDrawingCanvas>
) {
  const activeGestureRef = useRef<ActiveGesture | null>(null);
  const seedRef = useRef(1);
  const { dropHeldTool, getHeldTool, getToolPhase, rememberPointer, setHeldToolContact, updateHeldPointer } = world;
  const { finishDrawing, scheduleDrawing, startDrawing } = canvas;

  const releaseGesture = useCallback(
    (root = rootRef.current) => {
      const gesture = activeGestureRef.current;
      activeGestureRef.current = null;
      root?.classList.remove(HOME_TOOL_CONTACT_CLASS);
      if (root && gesture && typeof root.hasPointerCapture === "function" && root.hasPointerCapture(gesture.pointerId))
        root.releasePointerCapture(gesture.pointerId);
    },
    [rootRef]
  );
  const finishGesture = useCallback(
    (pointerId?: number) => {
      const gesture = activeGestureRef.current;
      if (!gesture || (pointerId !== undefined && gesture.pointerId !== pointerId)) return;
      releaseGesture();
      finishDrawing();
      setHeldToolContact(false);
    },
    [finishDrawing, releaseGesture, setHeldToolContact]
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
        finishGesture(event.pointerId);
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
        startDrawing(activeGesture.operation);
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
    [finishGesture, scheduleDrawing, startDrawing, updateHeldPointer]
  );

  const onPointerUp = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishGesture(event.pointerId),
    [finishGesture]
  );

  const onPointerCancel = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishGesture(event.pointerId),
    [finishGesture]
  );

  const onLostPointerCapture = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => finishGesture(event.pointerId),
    [finishGesture]
  );

  const onDragStart = useCallback<DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
  }, []);

  return {
    finishGesture,
    releaseGesture,
    pointerHandlers: { onDragStart, onLostPointerCapture, onPointerCancel, onPointerDown, onPointerMove, onPointerUp }
  };
}
