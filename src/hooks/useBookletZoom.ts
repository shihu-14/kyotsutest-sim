import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type WheelEvent } from "react";

const minimumZoom = 1;
const maximumZoom = 1.6;
export const BOOKLET_ZOOM_STEP = 0.03;

function clampZoom(value: number) {
  return Math.round(Math.min(maximumZoom, Math.max(minimumZoom, value)) * 1000) / 1000;
}

function normalizeWheelDelta(deltaY: number, deltaMode: number) {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return deltaY * 16;
  }

  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return deltaY * 100;
  }

  return deltaY;
}

export function useBookletZoom() {
  const [bookletZoom, setBookletZoom] = useState(minimumZoom);
  const bookletStageRef = useRef<HTMLDivElement | null>(null);
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const pendingWheelDeltaRef = useRef(0);
  const bookletStyle = { "--booklet-zoom": String(bookletZoom) } as CSSProperties;

  const changeBookletZoom = (change: number) => {
    setBookletZoom((current) => clampZoom(current + change));
  };

  useEffect(() => {
    const stage = bookletStageRef.current;
    const preventPageZoom = (event: globalThis.WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    stage?.addEventListener("wheel", preventPageZoom, { passive: false });
    return () => {
      stage?.removeEventListener("wheel", preventPageZoom);
      const frameId = zoomAnimationFrameRef.current;
      zoomAnimationFrameRef.current = null;
      pendingWheelDeltaRef.current = 0;
      if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const flushWheelZoom = () => {
    zoomAnimationFrameRef.current = null;
    const delta = pendingWheelDeltaRef.current;
    pendingWheelDeltaRef.current = 0;
    if (delta === 0) {
      return;
    }

    const magnitude = Math.min(BOOKLET_ZOOM_STEP, Math.max(0.003, Math.abs(delta) * 0.003));
    changeBookletZoom(delta < 0 ? magnitude : -magnitude);
  };

  const handleBookletWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    pendingWheelDeltaRef.current += normalizeWheelDelta(event.deltaY, event.deltaMode);
    if (zoomAnimationFrameRef.current !== null) {
      return;
    }

    if (typeof window.requestAnimationFrame !== "function") {
      flushWheelZoom();
      return;
    }

    zoomAnimationFrameRef.current = window.requestAnimationFrame(flushWheelZoom);
  };

  const handleBookletKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      changeBookletZoom(BOOKLET_ZOOM_STEP);
    }

    if (event.key === "-") {
      event.preventDefault();
      changeBookletZoom(-BOOKLET_ZOOM_STEP);
    }
  };

  return {
    bookletStageRef,
    bookletStyle,
    handleBookletKeyDown,
    handleBookletWheel
  };
}
