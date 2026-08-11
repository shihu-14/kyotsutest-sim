import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOOL_SIZES,
  HELD_TOOL_ROTATIONS,
  HOME_TOOL_GAP,
  REDUCED_MOTION_INITIAL_ROTATIONS,
  TOOL_CONTACT_ANCHORS,
  TOOL_CURSOR_OFFSETS,
  clientPointFromRoot,
  contactPointFromHeldCenter,
  droppedToolPhysicsState,
  heldCenterFromContact,
  initialLandingCenters,
  interpolateAngleShortest,
  physicsDeltaSeconds,
  resolveRestingX,
  restingToolY,
  rootPointFromClient,
  stepToolPhysics,
  toolCollisionHalfExtents,
  toolBoundsAt,
  type ToolPhysicsState
} from "./homeToolPhysics";

describe("homeToolPhysics", () => {
  it("uses timestamp deltas and clamps long frames", () => {
    expect(physicsDeltaSeconds(null, 100)).toBe(0);
    expect(physicsDeltaSeconds(100, 116)).toBeCloseTo(0.016);
    expect(physicsDeltaSeconds(100, 300)).toBe(0.032);
  });

  it("converts viewport coordinates through the scrolled root rect", () => {
    const rootRect = { left: 0, top: -369 };
    const rootPoint = rootPointFromClient({ x: 900, y: 300 }, rootRect);

    expect(rootPoint).toEqual({ x: 900, y: 669 });
    expect(clientPointFromRoot(rootPoint, rootRect)).toEqual({ x: 900, y: 300 });
  });

  it("keeps responsive landing positions in bounds and separated", () => {
    [320, 1280].forEach((rootWidth) => {
      const sizes =
        rootWidth === 320
          ? {
              pencil: { width: 64, height: (64 * 606) / 289 },
              eraser: { width: 54, height: (54 * 230) / 181 }
            }
          : DEFAULT_TOOL_SIZES;
      const centers = initialLandingCenters(rootWidth, sizes);
      const pencilBounds = toolBoundsAt(
        centers.pencil,
        sizes.pencil,
        REDUCED_MOTION_INITIAL_ROTATIONS.pencil
      );
      const eraserBounds = toolBoundsAt(
        centers.eraser,
        sizes.eraser,
        REDUCED_MOTION_INITIAL_ROTATIONS.eraser
      );

      expect(pencilBounds.left).toBeGreaterThanOrEqual(0);
      expect(eraserBounds.right).toBeLessThanOrEqual(rootWidth);
      expect(eraserBounds.left - pencilBounds.right).toBeGreaterThanOrEqual(HOME_TOOL_GAP);
    });
  });

  it("moves a requested resting position away from another tool", () => {
    const otherBounds = toolBoundsAt(400, DEFAULT_TOOL_SIZES.eraser, -61);
    const resolved = resolveRestingX(400, 800, DEFAULT_TOOL_SIZES.pencil, 47, otherBounds);
    const resolvedBounds = toolBoundsAt(resolved, DEFAULT_TOOL_SIZES.pencil, 47);

    expect(
      resolvedBounds.right + HOME_TOOL_GAP <= otherBounds.left ||
        resolvedBounds.left - HOME_TOOL_GAP >= otherBounds.right
    ).toBe(true);
  });

  it("bounces at the page floor and eventually settles above it", () => {
    let state: ToolPhysicsState = {
      x: 500,
      y: 650,
      vx: 0,
      vy: 500,
      rotation: 30,
      angularVelocity: 120,
      restingFrames: 0
    };
    let resting = false;

    for (let index = 0; index < 240 && !resting; index += 1) {
      const result = stepToolPhysics("pencil", state, DEFAULT_TOOL_SIZES.pencil, 720, 1280, 0.016);
      state = result.state;
      resting = result.resting;
    }

    expect(resting).toBe(true);
    expect(state.y + toolCollisionHalfExtents("pencil", DEFAULT_TOOL_SIZES.pencil, state.rotation).y).toBeCloseTo(
      720
    );
    expect(state.vy).toBe(0);
  });

  it("uses ground torque to settle the pencil shaft horizontally without snapping its angle", () => {
    const floorY = 720;
    const landingRotation = 120;
    let state: ToolPhysicsState = {
      x: 500,
      y: restingToolY("pencil", floorY, DEFAULT_TOOL_SIZES.pencil, landingRotation),
      vx: 0,
      vy: 0,
      rotation: landingRotation,
      angularVelocity: 0,
      restingFrames: 0
    };

    const firstContact = stepToolPhysics("pencil", state, DEFAULT_TOOL_SIZES.pencil, floorY, 1280, 0.016);
    expect(firstContact.state.rotation).toBe(landingRotation);
    expect(firstContact.state.angularVelocity).toBeLessThan(0);

    state = firstContact.state;
    let resting = false;
    for (let index = 0; index < 600 && !resting; index += 1) {
      const result = stepToolPhysics("pencil", state, DEFAULT_TOOL_SIZES.pencil, floorY, 1280, 0.016);
      state = result.state;
      resting = result.resting;
    }

    const shaftAngle = ((state.rotation - 68.27021020073764) * Math.PI) / 180;
    expect(resting).toBe(true);
    expect(Math.abs(Math.sin(shaftAngle))).toBeLessThan(0.015);
    expect(state.y + toolCollisionHalfExtents("pencil", DEFAULT_TOOL_SIZES.pencil, state.rotation).y).toBeCloseTo(
      floorY
    );
  });

  it("starts floor rotation through angular velocity instead of an instant angle correction", () => {
    const floorY = 720;
    const state: ToolPhysicsState = {
      x: 500,
      y: restingToolY("pencil", floorY, DEFAULT_TOOL_SIZES.pencil, 120),
      vx: 0,
      vy: 0,
      rotation: 120,
      angularVelocity: 0,
      restingFrames: 0
    };

    const result = stepToolPhysics("pencil", state, DEFAULT_TOOL_SIZES.pencil, floorY, 1280, 0.016);

    expect(result.state.rotation).toBe(120);
    expect(result.state.angularVelocity).toBeLessThan(0);
  });

  it("drops a held tool without injecting angular velocity", () => {
    expect(droppedToolPhysicsState({ x: 320, y: 240 }, 73)).toMatchObject({
      x: 320,
      y: 240,
      rotation: 73,
      angularVelocity: 0
    });
  });

  it("interpolates pickup rotation across the shortest side of the 360 degree boundary", () => {
    expect(interpolateAngleShortest(350, 10, 0.5)).toBe(360);
    expect(interpolateAngleShortest(10, 350, 0.5)).toBe(0);
  });

  it("anchors the pencil cursor to the visible lead tip in the cropped image", () => {
    expect(TOOL_CONTACT_ANCHORS.pencil).toEqual({ x: 260 / 289, y: 29 / 606 });
  });

  it("offsets the pencil nine pixels right and ten pixels up from the cursor", () => {
    expect(TOOL_CURSOR_OFFSETS.pencil).toEqual({ x: 9, y: -10 });
  });

  it.each(["pencil", "eraser"] as const)("keeps the %s contact anchor on the cursor", (kind) => {
    const cursor = { x: 410, y: 280 };
    const rotation = HELD_TOOL_ROTATIONS[kind];
    const center = heldCenterFromContact(kind, cursor, rotation, DEFAULT_TOOL_SIZES[kind]);

    const resolvedContact = contactPointFromHeldCenter(kind, center, rotation, DEFAULT_TOOL_SIZES[kind]);
    expect(resolvedContact.x).toBeCloseTo(cursor.x);
    expect(resolvedContact.y).toBeCloseTo(cursor.y);
    expect(center.x).toBeGreaterThan(cursor.x);
    expect(center.y).toBeLessThan(cursor.y);
  });
});
