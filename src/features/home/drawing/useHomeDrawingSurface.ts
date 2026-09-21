import { useEffect, useRef } from "react";
import { useDrawingCanvas } from "./useDrawingCanvas";
import { useDrawingGesture } from "./useDrawingGesture";
import { useHomeToolWorld } from "./useHomeToolWorld";

export function useHomeDrawingSurface() {
  const rootRef = useRef<HTMLDivElement>(null);
  const world = useHomeToolWorld(rootRef);
  const canvas = useDrawingCanvas(rootRef);
  const { finishGesture, releaseGesture, pointerHandlers } = useDrawingGesture(rootRef, world, canvas);
  const { canvasRef, disposeDrawing, resizeCanvas } = canvas;
  const {
    disposeToolWorld,
    ensureFallingToolsScheduled,
    initializeToolWorld,
    remeasureToolWorld,
    setReducedMotionPreference,
    settleForReducedMotion
  } = world;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
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
      if (event.matches) {
        finishGesture();
        settleForReducedMotion();
      }
    };
    window.addEventListener("resize", handleResize);
    mediaQuery?.addEventListener?.("change", handleMotionChange);
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(root);
    let mounted = true;
    document.fonts?.ready.then(() => {
      if (mounted) handleResize();
    });
    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      mediaQuery?.removeEventListener?.("change", handleMotionChange);
      resizeObserver?.disconnect();
      releaseGesture(root);
      disposeToolWorld();
      disposeDrawing();
    };
  }, [
    disposeDrawing,
    disposeToolWorld,
    ensureFallingToolsScheduled,
    finishGesture,
    initializeToolWorld,
    releaseGesture,
    remeasureToolWorld,
    resizeCanvas,
    setReducedMotionPreference,
    settleForReducedMotion
  ]);

  return {
    canvasRef,
    rootRef,
    pointerHandlers,
    pickUpTool: world.pickUpTool,
    registerToolElement: world.registerToolElement,
    remeasureToolWorld,
    toolPhases: world.toolPhases
  };
}
