export type HomeDrawingToolKind = "pencil" | "eraser";

export type HomeDrawingToolPhase = "falling" | "resting" | "lifting" | "held" | "contact";

export interface Point2D {
  x: number;
  y: number;
}

export interface ToolSize {
  width: number;
  height: number;
}

export interface ToolPhysicsState extends Point2D {
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  restingFrames: number;
}

export interface ToolBounds {
  left: number;
  right: number;
}

export const MAX_PHYSICS_DELTA_SECONDS = 0.032;
export const HOME_TOOL_GAP = 18;

export const DEFAULT_TOOL_SIZES: Record<HomeDrawingToolKind, ToolSize> = {
  pencil: { width: 92, height: (92 * 606) / 289 },
  eraser: { width: 76, height: (76 * 230) / 181 }
};

export const REDUCED_MOTION_INITIAL_ROTATIONS: Record<HomeDrawingToolKind, number> = {
  pencil: 68.27,
  eraser: 90
};

export const HELD_TOOL_ROTATIONS: Record<HomeDrawingToolKind, number> = {
  pencil: 180,
  eraser: -148
};

export const HELD_TOOL_LIFT = 8;

export const TOOL_CURSOR_OFFSETS: Record<HomeDrawingToolKind, Point2D> = {
  pencil: { x: 9, y: -10 },
  eraser: { x: 0, y: 0 }
};

export const TOOL_CONTACT_ANCHORS: Record<HomeDrawingToolKind, Point2D> = {
  pencil: { x: 260 / 289, y: 29 / 606 },
  eraser: { x: 88 / 181, y: 10 / 230 }
};

const PHYSICS_CONFIG: Record<
  HomeDrawingToolKind,
  { angularDamping: number; groundAngularDamping: number; groundTorque: number; restitution: number }
> = {
  pencil: { angularDamping: 0.55, groundAngularDamping: 0.9, groundTorque: 600, restitution: 0.28 },
  eraser: { angularDamping: 0.55, groundAngularDamping: 0.88, groundTorque: 420, restitution: 0.34 }
};

const TOOL_COLLISION_SHAPES: Record<
  HomeDrawingToolKind,
  { axisOffset: number; halfSegmentSource: number; radiusSource: number; sourceWidth: number }
> = {
  pencil: {
    axisOffset: -68.27021020073764,
    halfSegmentSource: 262,
    radiusSource: 35,
    sourceWidth: 289
  },
  eraser: { axisOffset: 90, halfSegmentSource: 25, radiusSource: 90, sourceWidth: 181 }
};

const GRAVITY = 1800;
const GROUND_CONTACT_TOLERANCE = 2;
const RESTING_ANGLE_SINE = 0.02;
const RESTING_ANGULAR_VELOCITY = 9;
const RESTING_VERTICAL_VELOCITY = 36;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function shortestAngleDistance(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

export function interpolateAngleShortest(from: number, to: number, progress: number) {
  return from + shortestAngleDistance(from, to) * progress;
}

export function physicsDeltaSeconds(previousTimestamp: number | null, timestamp: number) {
  if (previousTimestamp === null) {
    return 0;
  }

  return clamp((timestamp - previousTimestamp) / 1000, 0, MAX_PHYSICS_DELTA_SECONDS);
}

export function rotatedHalfExtents(size: ToolSize, rotation: number) {
  const radians = degreesToRadians(rotation);
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));

  return {
    x: (size.width * cosine + size.height * sine) / 2,
    y: (size.width * sine + size.height * cosine) / 2
  };
}

export function toolCollisionHalfExtents(kind: HomeDrawingToolKind, size: ToolSize, rotation: number) {
  const shape = TOOL_COLLISION_SHAPES[kind];
  const scale = size.width / shape.sourceWidth;
  const halfSegment = shape.halfSegmentSource * scale;
  const radius = shape.radiusSource * scale;
  const radians = degreesToRadians(rotation + shape.axisOffset);

  return {
    x: Math.abs(Math.cos(radians)) * halfSegment + radius,
    y: Math.abs(Math.sin(radians)) * halfSegment + radius
  };
}

export function toolBoundsAt(x: number, size: ToolSize, rotation: number): ToolBounds {
  const halfWidth = rotatedHalfExtents(size, rotation).x;
  return { left: x - halfWidth, right: x + halfWidth };
}

export function rootPointFromClient(point: Point2D, rootRect: Pick<DOMRect, "left" | "top">): Point2D {
  return {
    x: point.x - rootRect.left,
    y: point.y - rootRect.top
  };
}

export function clientPointFromRoot(point: Point2D, rootRect: Pick<DOMRect, "left" | "top">): Point2D {
  return {
    x: point.x + rootRect.left,
    y: point.y + rootRect.top
  };
}

export function heldCenterFromContact(
  kind: HomeDrawingToolKind,
  contactPoint: Point2D,
  rotation: number,
  size: ToolSize
): Point2D {
  const anchor = TOOL_CONTACT_ANCHORS[kind];
  const localOffset = {
    x: (anchor.x - 0.5) * size.width,
    y: (anchor.y - 0.5) * size.height
  };
  const radians = degreesToRadians(rotation);
  const rotatedOffset = {
    x: localOffset.x * Math.cos(radians) - localOffset.y * Math.sin(radians),
    y: localOffset.x * Math.sin(radians) + localOffset.y * Math.cos(radians)
  };

  return {
    x: contactPoint.x - rotatedOffset.x,
    y: contactPoint.y - rotatedOffset.y
  };
}

export function contactPointFromHeldCenter(
  kind: HomeDrawingToolKind,
  center: Point2D,
  rotation: number,
  size: ToolSize
): Point2D {
  const anchor = TOOL_CONTACT_ANCHORS[kind];
  const localOffset = {
    x: (anchor.x - 0.5) * size.width,
    y: (anchor.y - 0.5) * size.height
  };
  const radians = degreesToRadians(rotation);

  return {
    x: center.x + localOffset.x * Math.cos(radians) - localOffset.y * Math.sin(radians),
    y: center.y + localOffset.x * Math.sin(radians) + localOffset.y * Math.cos(radians)
  };
}

export function droppedToolPhysicsState(center: Point2D, rotation: number): ToolPhysicsState {
  return {
    ...center,
    vx: 0,
    vy: 0,
    rotation,
    angularVelocity: 0,
    restingFrames: 0
  };
}

export function restingToolY(kind: HomeDrawingToolKind, floorY: number, size: ToolSize, rotation: number) {
  return floorY - toolCollisionHalfExtents(kind, size, rotation).y;
}

export function initialLandingCenters(
  rootWidth: number,
  sizes: Record<HomeDrawingToolKind, ToolSize> = DEFAULT_TOOL_SIZES,
  rotations: Record<HomeDrawingToolKind, number> = REDUCED_MOTION_INITIAL_ROTATIONS
) {
  const margin = 16;
  const pencilHalfWidth = rotatedHalfExtents(sizes.pencil, rotations.pencil).x;
  const eraserHalfWidth = rotatedHalfExtents(sizes.eraser, rotations.eraser).x;
  const eraserX = clamp(rootWidth * 0.9, eraserHalfWidth + margin, rootWidth - eraserHalfWidth - margin);
  const desiredPencilX = clamp(
    rootWidth * 0.74,
    pencilHalfWidth + margin,
    rootWidth - pencilHalfWidth - margin
  );
  const pencilX = Math.min(desiredPencilX, eraserX - eraserHalfWidth - HOME_TOOL_GAP - pencilHalfWidth);

  return {
    pencil: clamp(pencilX, pencilHalfWidth + margin, rootWidth - pencilHalfWidth - margin),
    eraser: eraserX
  };
}

export function resolveRestingX(
  requestedX: number,
  rootWidth: number,
  size: ToolSize,
  rotation: number,
  otherBounds: ToolBounds | null
) {
  const margin = 16;
  const halfWidth = rotatedHalfExtents(size, rotation).x;
  const minimum = halfWidth + margin;
  const maximum = rootWidth - halfWidth - margin;
  const clamped = clamp(requestedX, minimum, maximum);
  if (!otherBounds) {
    return clamped;
  }

  const currentBounds = { left: clamped - halfWidth, right: clamped + halfWidth };
  if (
    currentBounds.right + HOME_TOOL_GAP <= otherBounds.left ||
    currentBounds.left - HOME_TOOL_GAP >= otherBounds.right
  ) {
    return clamped;
  }

  const leftCandidate = otherBounds.left - HOME_TOOL_GAP - halfWidth;
  const rightCandidate = otherBounds.right + HOME_TOOL_GAP + halfWidth;
  const candidates = [leftCandidate, rightCandidate].filter((candidate) => candidate >= minimum && candidate <= maximum);
  if (candidates.length === 0) {
    return clamped;
  }

  return candidates.reduce((nearest, candidate) =>
    Math.abs(candidate - requestedX) < Math.abs(nearest - requestedX) ? candidate : nearest
  );
}

export function stepToolPhysics(
  kind: HomeDrawingToolKind,
  state: ToolPhysicsState,
  size: ToolSize,
  floorY: number,
  rootWidth: number,
  deltaSeconds: number
) {
  if (deltaSeconds <= 0) {
    return { resting: false, state };
  }

  const config = PHYSICS_CONFIG[kind];
  let next: ToolPhysicsState = {
    ...state,
    x: state.x + state.vx * deltaSeconds,
    y: state.y + state.vy * deltaSeconds + (GRAVITY * deltaSeconds * deltaSeconds) / 2,
    vy: state.vy + GRAVITY * deltaSeconds,
    rotation: state.rotation + state.angularVelocity * deltaSeconds
  };
  const extents = toolCollisionHalfExtents(kind, size, next.rotation);
  next.x = clamp(next.x, extents.x, Math.max(extents.x, rootWidth - extents.x));

  if (next.y + extents.y < floorY - GROUND_CONTACT_TOLERANCE) {
    return { resting: false, state: { ...next, restingFrames: 0 } };
  }

  next.y = floorY - extents.y;
  if (Math.abs(next.vy) > RESTING_VERTICAL_VELOCITY) {
    return {
      resting: false,
      state: {
        ...next,
        vx: next.vx * 0.72,
        vy: -Math.abs(next.vy) * config.restitution,
        angularVelocity: next.angularVelocity * config.angularDamping,
        restingFrames: 0
      }
    };
  }

  const shape = TOOL_COLLISION_SHAPES[kind];
  const axisRadians = degreesToRadians(next.rotation + shape.axisOffset);
  const axisSine = Math.sin(axisRadians);
  const gravitationalTorque =
    Math.abs(axisSine) < Number.EPSILON
      ? 0
      : -Math.sign(axisSine) * Math.cos(axisRadians) * config.groundTorque;
  const groundedAngularVelocity =
    (next.angularVelocity + gravitationalTorque * deltaSeconds) * config.groundAngularDamping;
  const restingFrames =
    Math.abs(axisSine) < RESTING_ANGLE_SINE &&
    Math.abs(groundedAngularVelocity) < RESTING_ANGULAR_VELOCITY
      ? next.restingFrames + 1
      : 0;

  if (restingFrames < 2) {
    return {
      resting: false,
      state: {
        ...next,
        y: restingToolY(kind, floorY, size, next.rotation),
        vx: next.vx * 0.72,
        vy: 0,
        angularVelocity: groundedAngularVelocity,
        restingFrames
      }
    };
  }

  return {
    resting: true,
    state: {
      ...next,
      y: restingToolY(kind, floorY, size, next.rotation),
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      restingFrames
    }
  };
}
