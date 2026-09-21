import { useCallback, useRef, useState, type RefObject } from "react";
import { DEFAULT_TOOL_SIZES, rootPointFromClient, type HomeDrawingToolKind, type Point2D } from "./homeToolPhysics";
import { HomeToolWorld } from "./homeToolWorld";

const kinds: HomeDrawingToolKind[] = ["pencil", "eraser"];

export function useHomeToolWorld(rootRef: RefObject<HTMLDivElement | null>) {
  const worldRef = useRef<HomeToolWorld | null>(null);
  worldRef.current ??= new HomeToolWorld();
  const world = worldRef.current;
  const elements = useRef<Record<HomeDrawingToolKind, HTMLButtonElement | null>>({ pencil: null, eraser: null });
  const frameRef = useRef<number | null>(null);
  const loopRef = useRef<FrameRequestCallback>(() => undefined);
  const [toolPhases, setToolPhases] = useState(world.phases);

  const paint = useCallback(() => {
    setToolPhases(world.phases);
    for (const kind of kinds) {
      const element = elements.current[kind];
      if (!element) continue;
      const phase = world.phases[kind];
      const pose = world.poses[kind];
      element.style.position = phase === "held" || phase === "contact" || phase === "lifting" ? "fixed" : "absolute";
      element.style.left = `${pose.x}px`;
      element.style.top = `${pose.y}px`;
      element.style.transform = `translate(-50%, -50%) rotate(${pose.rotation}deg)`;
    }
  }, [world]);

  const schedule = useCallback(() => {
    if (frameRef.current !== null) return;
    if (typeof window.requestAnimationFrame !== "function") {
      world.settleWithoutAnimation();
      paint();
      return;
    }
    frameRef.current = window.requestAnimationFrame((timestamp) => loopRef.current(timestamp));
  }, [paint, world]);
  loopRef.current = (timestamp) => {
    frameRef.current = null;
    const active = world.step(timestamp);
    paint();
    if (active) schedule();
  };
  const cancel = useCallback(() => {
    const frame = frameRef.current;
    frameRef.current = null;
    if (frame !== null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(frame);
  }, []);

  const registerToolElement = useCallback(
    (kind: HomeDrawingToolKind, element: HTMLButtonElement | null) => {
      elements.current[kind] = element;
      if (element)
        world.sizes[kind] = {
          width: element.offsetWidth || DEFAULT_TOOL_SIZES[kind].width,
          height: element.offsetHeight || DEFAULT_TOOL_SIZES[kind].height
        };
    },
    [world]
  );
  const ensureFallingToolsScheduled = useCallback(() => {
    if (kinds.some((kind) => world.phases[kind] === "falling")) schedule();
  }, [schedule, world]);
  const remeasureToolWorld = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const kind of kinds) registerToolElement(kind, elements.current[kind]);
    const bounds = root.getBoundingClientRect();
    const previousPhases = world.phases;
    world.measure({ width: bounds.width, height: bounds.height }, world.sizes);
    paint();
    if (world.phases !== previousPhases) ensureFallingToolsScheduled();
  }, [ensureFallingToolsScheduled, paint, registerToolElement, rootRef, world]);
  const initializeToolWorld = useCallback(() => {
    remeasureToolWorld();
    world.initialize(typeof window.requestAnimationFrame === "function");
    paint();
    ensureFallingToolsScheduled();
  }, [ensureFallingToolsScheduled, paint, remeasureToolWorld, world]);
  const dropHeldTool = useCallback(() => {
    const root = rootRef.current;
    const element = world.heldTool ? elements.current[world.heldTool] : null;
    if (!root || !element) return;
    const bounds = element.getBoundingClientRect();
    world.drop(
      rootPointFromClient(
        { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
        root.getBoundingClientRect()
      )
    );
    paint();
    ensureFallingToolsScheduled();
  }, [ensureFallingToolsScheduled, paint, rootRef, world]);
  const pickUpTool = useCallback(
    (kind: HomeDrawingToolKind, point: Point2D) => {
      if (world.phases[kind] !== "resting") return;
      if (world.heldTool && world.heldTool !== kind) dropHeldTool();
      const element = elements.current[kind];
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      const lifting = world.pickUp(
        kind,
        point,
        { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
        typeof window.requestAnimationFrame === "function"
      );
      paint();
      if (lifting) schedule();
    },
    [dropHeldTool, paint, schedule, world]
  );
  const updateHeldPointer = useCallback(
    (point: Point2D, contact: boolean) => {
      world.updatePointer(point, contact);
      paint();
    },
    [paint, world]
  );
  const setHeldToolContact = useCallback(
    (contact: boolean) => {
      world.setContact(contact);
      paint();
    },
    [paint, world]
  );
  const rememberPointer = useCallback(
    (point: Point2D) => {
      world.lastPointer = point;
    },
    [world]
  );
  const setReducedMotionPreference = useCallback(
    (reduced: boolean) => {
      world.reducedMotion = reduced;
    },
    [world]
  );
  const settleForReducedMotion = useCallback(() => {
    cancel();
    world.settleForReducedMotion();
    paint();
  }, [cancel, paint, world]);
  const disposeToolWorld = useCallback(() => {
    cancel();
    world.dispose();
  }, [cancel, world]);
  const getHeldTool = useCallback(() => world.heldTool, [world]);
  const getToolPhase = useCallback((kind: HomeDrawingToolKind) => world.phases[kind], [world]);

  return {
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
  };
}
