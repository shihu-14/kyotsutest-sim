import { describe, expect, it } from "vitest";
import { parseAuthoringAttributes, positiveChoiceCount } from "./authoringSyntax";

describe("authoringSyntax", () => {
  it("parses attributes without truncating values that contain equals signs", () => {
    expect(parseAuthoringAttributes("answer=1|2,token=a=b, multi=true")).toEqual({
      answer: "1|2",
      token: "a=b",
      multi: "true"
    });
  });

  it("normalizes choice counts with the existing fallback", () => {
    expect(positiveChoiceCount(4.9)).toBe(4);
    expect(positiveChoiceCount(0)).toBe(1);
    expect(positiveChoiceCount(Number.NaN)).toBe(1);
  });
});
