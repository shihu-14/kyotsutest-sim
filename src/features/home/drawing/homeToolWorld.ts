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
  stepToolPhysics,
  toolBoundsAt,
  type HomeDrawingToolKind,
  type HomeDrawingToolPhase,
  type Point2D,
  type ToolPhysicsState,
  type ToolSize
} from "./homeToolPhysics";

const kinds: HomeDrawingToolKind[] = ["pencil", "eraser"];
const initialRotations = { pencil: -18, eraser: 28 };
interface LiftAnimation {
  kind: HomeDrawingToolKind;
  from: ToolPhysicsState;
  to: ToolPhysicsState;
  startTimestamp: number | null;
}
function initialPose(kind: HomeDrawingToolKind): ToolPhysicsState {
  return {
    x: 0,
    y: kind === "pencil" ? -112 : -64,
    vx: 0,
    vy: kind === "pencil" ? 0 : 40,
    rotation: initialRotations[kind],
    angularVelocity: kind === "pencil" ? 82 : -112,
    restingFrames: 0
  };
}

export class HomeToolWorld {
  poses = { pencil: initialPose("pencil"), eraser: initialPose("eraser") };
  phases: Record<HomeDrawingToolKind, HomeDrawingToolPhase> = { pencil: "falling", eraser: "falling" };
  sizes = { pencil: { ...DEFAULT_TOOL_SIZES.pencil }, eraser: { ...DEFAULT_TOOL_SIZES.eraser } };
  heldTool: HomeDrawingToolKind | null = null;
  lastPointer: Point2D = { x: 0, y: 0 };
  reducedMotion = false;
  private floor = { width: 0, height: 0 };
  private restingX: Record<HomeDrawingToolKind, number | null> = { pencil: null, eraser: null };
  private lift: LiftAnimation | null = null;
  private lastTimestamp: number | null = null;

  private setPhase(kind: HomeDrawingToolKind, phase: HomeDrawingToolPhase) {
    if (this.phases[kind] !== phase) this.phases = { ...this.phases, [kind]: phase };
  }

  private settle(kind: HomeDrawingToolKind) {
    const other = kind === "pencil" ? "eraser" : "pencil";
    const otherBounds =
      this.phases[other] === "resting"
        ? toolBoundsAt(this.poses[other].x, this.sizes[other], this.poses[other].rotation)
        : null;
    const rotation = this.poses[kind].rotation;
    const x = resolveRestingX(
      this.restingX[kind] ?? this.poses[kind].x,
      this.floor.width,
      this.sizes[kind],
      rotation,
      otherBounds
    );
    this.restingX[kind] = x;
    this.poses[kind] = {
      x,
      y: restingToolY(kind, this.floor.height, this.sizes[kind], rotation),
      vx: 0,
      vy: 0,
      rotation,
      angularVelocity: 0,
      restingFrames: 2
    };
    this.setPhase(kind, "resting");
  }

  private placeOnFloor() {
    const centers = initialLandingCenters(this.floor.width, this.sizes);
    for (const kind of kinds) {
      const rotation = REDUCED_MOTION_INITIAL_ROTATIONS[kind];
      this.restingX[kind] = centers[kind];
      this.poses[kind] = {
        x: centers[kind],
        y: restingToolY(kind, this.floor.height, this.sizes[kind], rotation),
        vx: 0,
        vy: 0,
        rotation,
        angularVelocity: 0,
        restingFrames: 2
      };
      this.setPhase(kind, "resting");
    }
  }

  measure(floor: { width: number; height: number }, sizes: Record<HomeDrawingToolKind, ToolSize>) {
    const floorMovedDown = this.floor.height > 0 && floor.height > this.floor.height + 1;
    this.floor = floor;
    this.sizes = sizes;
    const centers = initialLandingCenters(floor.width, sizes);
    for (const kind of kinds) {
      if (this.phases[kind] !== "resting") continue;
      this.restingX[kind] ??= centers[kind];
      if (floorMovedDown && !this.reducedMotion) {
        this.poses[kind] = { ...this.poses[kind], vx: 0, vy: 0, angularVelocity: 0, restingFrames: 0 };
        this.setPhase(kind, "falling");
        this.lastTimestamp = null;
      } else this.settle(kind);
    }
  }

  initialize(animate: boolean) {
    this.dispose();
    const centers = initialLandingCenters(this.floor.width, this.sizes, initialRotations);
    this.restingX = { ...centers };
    if (this.reducedMotion || !animate) {
      this.placeOnFloor();
      return;
    }
    for (const kind of kinds) {
      this.poses[kind] = { ...initialPose(kind), x: centers[kind] };
      this.setPhase(kind, "falling");
    }
  }

  step(timestamp: number): boolean {
    const delta = physicsDeltaSeconds(this.lastTimestamp, timestamp);
    this.lastTimestamp = timestamp;
    let active = false;
    if (this.lift) {
      const lift = this.lift;
      lift.startTimestamp ??= timestamp;
      const progress = Math.min(1, (timestamp - lift.startTimestamp) / 120);
      this.poses[lift.kind] = {
        x: lift.from.x + (lift.to.x - lift.from.x) * progress,
        y: lift.from.y + (lift.to.y - lift.from.y) * progress,
        rotation: interpolateAngleShortest(lift.from.rotation, lift.to.rotation, progress),
        vx: 0,
        vy: 0,
        angularVelocity: 0,
        restingFrames: 0
      };
      if (progress >= 1) {
        this.lift = null;
        this.setPhase(lift.kind, "held");
      } else active = true;
    }
    for (const kind of kinds) {
      if (this.phases[kind] !== "falling") continue;
      const result = stepToolPhysics(
        kind,
        this.poses[kind],
        this.sizes[kind],
        this.floor.height,
        this.floor.width,
        delta
      );
      this.poses[kind] = result.state;
      if (result.resting) this.settle(kind);
      else active = true;
    }
    if (!active) this.lastTimestamp = null;
    return active;
  }

  settleWithoutAnimation() {
    for (const kind of kinds) if (this.phases[kind] === "falling") this.settle(kind);
    if (this.lift) {
      this.poses[this.lift.kind] = this.lift.to;
      this.setPhase(this.lift.kind, "held");
      this.lift = null;
    }
  }

  drop(center: Point2D) {
    const kind = this.heldTool;
    if (!kind) return;
    this.heldTool = null;
    this.lift = null;
    this.restingX[kind] = center.x;
    this.poses[kind] = droppedToolPhysicsState(center, this.poses[kind].rotation);
    this.setPhase(kind, "falling");
    this.lastTimestamp = null;
    if (this.reducedMotion) this.settle(kind);
  }

  pickUp(kind: HomeDrawingToolKind, point: Point2D, center: Point2D, animate: boolean) {
    if (this.phases[kind] !== "resting") return false;
    const from: ToolPhysicsState = {
      ...center,
      rotation: this.poses[kind].rotation,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      restingFrames: 0
    };
    const target = heldCenterFromContact(
      kind,
      { x: point.x + TOOL_CURSOR_OFFSETS[kind].x, y: point.y + TOOL_CURSOR_OFFSETS[kind].y - HELD_TOOL_LIFT },
      HELD_TOOL_ROTATIONS[kind],
      this.sizes[kind]
    );
    const to = { ...from, ...target, rotation: HELD_TOOL_ROTATIONS[kind] };
    this.heldTool = kind;
    this.lastPointer = point;
    this.poses[kind] = from;
    this.setPhase(kind, "lifting");
    if (this.reducedMotion || !animate) {
      this.poses[kind] = to;
      this.setPhase(kind, "held");
      return false;
    }
    this.lift = { kind, from, to, startTimestamp: null };
    this.lastTimestamp = null;
    return true;
  }

  updatePointer(point: Point2D, contact: boolean) {
    this.lastPointer = point;
    const kind = this.heldTool;
    if (!kind || this.phases[kind] === "lifting") return;
    const center = heldCenterFromContact(
      kind,
      {
        x: point.x + TOOL_CURSOR_OFFSETS[kind].x,
        y: point.y + TOOL_CURSOR_OFFSETS[kind].y - (contact ? 0 : HELD_TOOL_LIFT)
      },
      HELD_TOOL_ROTATIONS[kind],
      this.sizes[kind]
    );
    this.poses[kind] = {
      ...center,
      rotation: HELD_TOOL_ROTATIONS[kind],
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      restingFrames: 0
    };
  }

  setContact(contact: boolean) {
    if (!this.heldTool) return;
    this.setPhase(this.heldTool, contact ? "contact" : "held");
    this.updatePointer(this.lastPointer, contact);
  }

  settleForReducedMotion() {
    this.dispose();
    this.placeOnFloor();
  }
  dispose() {
    this.heldTool = null;
    this.lift = null;
    this.lastTimestamp = null;
  }
}
