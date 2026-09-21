import { beforeEach, describe, expect, it } from "vitest";
import { clearAnswers, clearDeadline, loadAnswers, saveAnswers, saveDeadline } from "./examStorage";

describe("examStorage", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps the existing answer and deadline storage keys", () => {
    saveAnswers("exam-1", { q1: ["2"] });
    saveDeadline("exam-1", 12_345);

    expect(window.localStorage.getItem("kyotsu-test-sim:answers:exam-1")).toBe('{"q1":["2"]}');
    expect(window.localStorage.getItem("kyotsu-test-sim:deadline:exam-1")).toBe("12345");
    expect(loadAnswers("exam-1")).toEqual({ q1: ["2"] });

    clearAnswers("exam-1");
    clearDeadline("exam-1");
    expect(window.localStorage.length).toBe(0);
  });
});
