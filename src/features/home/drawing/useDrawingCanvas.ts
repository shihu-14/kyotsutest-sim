import { useCallback, useRef, type RefObject } from "react";
import { renderHomeDrawing, type DrawingOperation } from "./homeDrawingRenderer";

export function useDrawingCanvas(rootRef: RefObject<HTMLDivElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const operationsRef = useRef<DrawingOperation[]>([]);
  const activeOperationRef = useRef<DrawingOperation | null>(null);
  const hasDrawingRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const renderDrawing = useCallback(() => {
    frameRef.current = null;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const bounds = root.getBoundingClientRect();
    renderHomeDrawing(
      context,
      bounds.width,
      bounds.height,
      operationsRef.current,
      activeOperationRef.current ?? undefined
    );
  }, [rootRef]);

  const scheduleDrawing = useCallback(() => {
    if (frameRef.current !== null) return;
    if (typeof window.requestAnimationFrame === "function") {
      frameRef.current = window.requestAnimationFrame(renderDrawing);
    } else renderDrawing();
  }, [renderDrawing]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const bounds = root.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    scheduleDrawing();
  }, [rootRef, scheduleDrawing]);

  const startDrawing = useCallback((operation: DrawingOperation) => {
    activeOperationRef.current = operation;
    if (operation.kind === "pencil") hasDrawingRef.current = true;
  }, []);
  const finishDrawing = useCallback(() => {
    const operation = activeOperationRef.current;
    if (operation && (operation.kind === "pencil" || hasDrawingRef.current)) operationsRef.current.push(operation);
    activeOperationRef.current = null;
    scheduleDrawing();
  }, [scheduleDrawing]);
  const disposeDrawing = useCallback(() => {
    activeOperationRef.current = null;
    const frame = frameRef.current;
    frameRef.current = null;
    if (frame !== null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(frame);
  }, []);

  return { canvasRef, startDrawing, finishDrawing, resizeCanvas, scheduleDrawing, disposeDrawing };
}
