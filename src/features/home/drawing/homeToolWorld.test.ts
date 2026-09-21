import { describe, expect, it } from "vitest";
import { DEFAULT_TOOL_SIZES, HELD_TOOL_ROTATIONS, restingToolY } from "./homeToolPhysics";
import { HomeToolWorld } from "./homeToolWorld";

describe("HomeToolWorld", () => {
  it("lifts from the measured pose and drops in surface coordinates", () => {
    const world = new HomeToolWorld();
    world.measure({ width: 1000, height: 800 }, DEFAULT_TOOL_SIZES);
    world.initialize(false);
    world.pickUp("pencil", { x: 200, y: 150 }, { x: 700, y: 600 }, true);
    expect(world.phases.pencil).toBe("lifting");
    expect(world.poses.pencil.x).toBe(700);
    expect(world.step(100)).toBe(true);
    world.step(220);
    expect(world.phases.pencil).toBe("held");
    expect(world.poses.pencil.rotation).toBe(HELD_TOOL_ROTATIONS.pencil);
    world.drop({ x: 120, y: 80 });
    expect(world.heldTool).toBeNull();
    expect(world.phases.pencil).toBe("falling");
    expect(world.poses.pencil).toMatchObject({ x: 120, y: 80 });
    for (let time = 240; time < 15_000 && world.phases.pencil === "falling"; time += 16) world.step(time);
    expect(world.phases.pencil).toBe("resting");
    expect(world.poses.pencil.y).toBeCloseTo(
      restingToolY("pencil", 800, DEFAULT_TOOL_SIZES.pencil, world.poses.pencil.rotation)
    );
  });

  it("restarts falling when the floor grows and settles when motion is reduced", () => {
    const world = new HomeToolWorld();
    world.measure({ width: 1000, height: 800 }, DEFAULT_TOOL_SIZES);
    world.initialize(false);
    world.measure({ width: 1000, height: 1200 }, DEFAULT_TOOL_SIZES);
    expect(world.phases).toEqual({ pencil: "falling", eraser: "falling" });
    world.reducedMotion = true;
    world.settleForReducedMotion();
    expect(world.phases).toEqual({ pencil: "resting", eraser: "resting" });
    expect(world.step(100)).toBe(false);
    expect(world.poses.eraser.y).toBeCloseTo(restingToolY("eraser", 1200, DEFAULT_TOOL_SIZES.eraser, 90));
  });
});
