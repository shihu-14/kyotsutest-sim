import { useCallback, useRef, useState, type RefObject } from "react";
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

const TOOL_KINDS: HomeDrawingToolKind[] = ["pencil", "eraser"];
const INITIAL_FALL_ROTATIONS: Record<HomeDrawingToolKind, number> = { pencil: -18, eraser: 28 };
const INITIAL_TOOL_PHASES: Record<HomeDrawingToolKind, HomeDrawingToolPhase> = {
  pencil: "falling",
  eraser: "falling"
};

interface LiftAnimation {
  kind: HomeDrawingToolKind;
  from: ToolPhysicsState;
  to: ToolPhysicsState;
  startTimestamp: number | null;
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

export function useHomeToolWorld(rootRef: RefObject<HTMLDivElement | null>) {
  const physicsAnimationFrameRef = useRef<number | null>(null);
  const physicsLoopRef = useRef<FrameRequestCallback>(() => undefined);
  const lastPhysicsTimestampRef = useRef<number | null>(null);
  const liftAnimationRef = useRef<LiftAnimation | null>(null);
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

  const remeasureToolWorld = useCallback(() => {
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
  }, [applyToolPose, rootRef, schedulePhysics, setToolPhase, settleTool]);

  const ensureFallingToolsScheduled = useCallback(() => {
    if (TOOL_KINDS.some((kind) => toolPhasesRef.current[kind] === "falling")) {
      schedulePhysics();
    }
  }, [schedulePhysics]);

  const initializeToolWorld = useCallback(() => {
    remeasureToolWorld();
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
  }, [applyToolPose, placeToolsOnFloor, remeasureToolWorld, schedulePhysics, setToolPhase]);

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
  }, [applyToolPose, rootRef, schedulePhysics, setToolPhase, settleTool]);

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

  const rememberPointer = useCallback((point: Point2D) => {
    lastPointerRef.current = point;
  }, []);

  const updateHeldPointer = useCallback(
    (point: Point2D, isContact: boolean) => {
      lastPointerRef.current = point;
      const heldTool = heldToolRef.current;
      if (heldTool && toolPhasesRef.current[heldTool] !== "lifting") {
        updateHeldToolPosition(heldTool, point, isContact);
      }
    },
    [updateHeldToolPosition]
  );

  const setHeldToolContact = useCallback(
    (isContact: boolean) => {
      const heldTool = heldToolRef.current;
      if (!heldTool) {
        return;
      }
      setToolPhase(heldTool, isContact ? "contact" : "held");
      updateHeldToolPosition(heldTool, lastPointerRef.current, isContact);
    },
    [setToolPhase, updateHeldToolPosition]
  );

  const setReducedMotionPreference = useCallback((reduced: boolean) => {
    reducedMotionRef.current = reduced;
  }, []);

  const settleForReducedMotion = useCallback(() => {
    const frameId = physicsAnimationFrameRef.current;
    physicsAnimationFrameRef.current = null;
    if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(frameId);
    }
    liftAnimationRef.current = null;
    heldToolRef.current = null;
    placeToolsOnFloor();
  }, [placeToolsOnFloor]);

  const disposeToolWorld = useCallback(() => {
    heldToolRef.current = null;
    liftAnimationRef.current = null;
    lastPhysicsTimestampRef.current = null;
    const frameId = physicsAnimationFrameRef.current;
    physicsAnimationFrameRef.current = null;
    if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(frameId);
    }
  }, []);

  const getHeldTool = useCallback(() => heldToolRef.current, []);
  const getToolPhase = useCallback((kind: HomeDrawingToolKind) => toolPhasesRef.current[kind], []);

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
