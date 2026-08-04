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
export const HOME_TOOL_GAP = 16;

export const DEFAULT_TOOL_SIZES: Record<HomeDrawingToolKind, ToolSize> = {
  pencil: { width: 156, height: 22 },
  eraser: { width: 64, height: 34 }
};

export const RESTING_ROTATIONS: Record<HomeDrawingToolKind, number> = {
  pencil: 6,
  eraser: -8
};

const PHYSICS_CONFIG: Record<
  HomeDrawingToolKind,
  { angularDamping: number; restitution: number; settleRotation: number }
> = {
  pencil: { angularDamping: 0.55, restitution: 0.28, settleRotation: RESTING_ROTATIONS.pencil },
  eraser: { angularDamping: 0.55, restitution: 0.34, settleRotation: RESTING_ROTATIONS.eraser }
};

const GRAVITY = 1800;
const RESTING_ANGULAR_VELOCITY = 12;
const RESTING_VERTICAL_VELOCITY = 36;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function shortestAngleDistance(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
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
  const localOffset =
    kind === "pencil"
      ? { x: size.width / 2 - 2, y: 0 }
      : { x: 0, y: size.height / 2 - 2 };
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

export function restingToolY(floorY: number, size: ToolSize, rotation: number) {
  return floorY - rotatedHalfExtents(size, rotation).y;
}

export function initialLandingCenters(
  rootWidth: number,
  sizes: Record<HomeDrawingToolKind, ToolSize> = DEFAULT_TOOL_SIZES
) {
  const margin = 16;
  const pencilHalfWidth = rotatedHalfExtents(sizes.pencil, RESTING_ROTATIONS.pencil).x;
  const eraserHalfWidth = rotatedHalfExtents(sizes.eraser, RESTING_ROTATIONS.eraser).x;
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
  const extents = rotatedHalfExtents(size, next.rotation);
  next.x = clamp(next.x, extents.x, Math.max(extents.x, rootWidth - extents.x));

  if (next.y + extents.y < floorY) {
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

  const rotationDistance = shortestAngleDistance(next.rotation, config.settleRotation);
  const settledRotation = next.rotation + rotationDistance * Math.min(1, deltaSeconds * 18);
  const angularVelocity = next.angularVelocity * config.angularDamping;
  const restingFrames =
    Math.abs(angularVelocity) < RESTING_ANGULAR_VELOCITY && Math.abs(rotationDistance) < 1.5
      ? next.restingFrames + 1
      : 0;

  if (restingFrames < 2) {
    const settledExtents = rotatedHalfExtents(size, settledRotation);
    return {
      resting: false,
      state: {
        ...next,
        y: floorY - settledExtents.y,
        vy: 0,
        rotation: settledRotation,
        angularVelocity,
        restingFrames
      }
    };
  }

  return {
    resting: true,
    state: {
      ...next,
      y: restingToolY(floorY, size, config.settleRotation),
      vx: 0,
      vy: 0,
      rotation: config.settleRotation,
      angularVelocity: 0,
      restingFrames
    }
  };
}
