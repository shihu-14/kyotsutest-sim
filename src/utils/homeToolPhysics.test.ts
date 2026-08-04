import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOOL_SIZES,
  HOME_TOOL_GAP,
  clientPointFromRoot,
  initialLandingCenters,
  physicsDeltaSeconds,
  resolveRestingX,
  rootPointFromClient,
  rotatedHalfExtents,
  stepToolPhysics,
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
      const centers = initialLandingCenters(rootWidth);
      const pencilBounds = toolBoundsAt(centers.pencil, DEFAULT_TOOL_SIZES.pencil, 6);
      const eraserBounds = toolBoundsAt(centers.eraser, DEFAULT_TOOL_SIZES.eraser, -8);

      expect(pencilBounds.left).toBeGreaterThanOrEqual(0);
      expect(eraserBounds.right).toBeLessThanOrEqual(rootWidth);
      expect(eraserBounds.left - pencilBounds.right).toBeGreaterThanOrEqual(HOME_TOOL_GAP);
    });
  });

  it("moves a requested resting position away from another tool", () => {
    const otherBounds = toolBoundsAt(250, DEFAULT_TOOL_SIZES.eraser, -8);
    const resolved = resolveRestingX(250, 500, DEFAULT_TOOL_SIZES.pencil, 6, otherBounds);
    const resolvedBounds = toolBoundsAt(resolved, DEFAULT_TOOL_SIZES.pencil, 6);

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
    expect(state.y + rotatedHalfExtents(DEFAULT_TOOL_SIZES.pencil, state.rotation).y).toBeCloseTo(720);
    expect(state.vy).toBe(0);
  });
});
