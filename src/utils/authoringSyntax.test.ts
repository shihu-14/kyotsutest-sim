import { describe, expect, it } from "vitest";
import {
  authoringBodyComment,
  authoringLayoutCommentLines,
  authoringMarkComment,
  parseAuthoringAttributes,
  positiveChoiceCount,
  serializeChoiceCommand,
  serializeMarkCommand
} from "./authoringSyntax";

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

  it("serializes the canonical mark, choice, and annotation syntax", () => {
    const mark = { answer: "1|3", choices: 5, label: "ア", multi: true, points: 6 };

    expect(serializeMarkCommand(mark)).toBe("\\mark[answer=1|3,points=6,choices=5,multi=true]{ア}");
    expect(serializeChoiceCommand(mark, { value: "1", content: "Alpha" })).toBe("\\choice{ア}{1}{Alpha}");
    expect(authoringBodyComment("大問本文: 第1問", false)).toContain("ここに問題文を記述");
    expect(authoringMarkComment(mark)).toContain("正解 1|3 / 配点 6 / 選択肢 5");
    expect(authoringLayoutCommentLines()).toHaveLength(4);
  });
});
