import { describe, expect, it } from "vitest";
import { animeOnlymarkAnswerKey, animeOnlymarkExam } from "../data/exams/animeOnlymark2026";
import { defaultAuthoringSource } from "./authoringDefaults";
import { parseAuthoringLatex } from "./authoringPreview";
import { renderMathSegments } from "./math";

describe("authoring preview and math utilities", () => {
  it("extracts mark commands into grading slots", () => {
    const parsed = parseAuthoringLatex(String.raw`\examtitle{Sample}
\sectiontitle{第1問}
\mark[answer=0|2,points=7,choices=4,multi=true]{ア}`);

    expect(parsed.title).toBe("Sample");
    expect(parsed.marks).toHaveLength(1);
    expect(parsed.marks[0]).toMatchObject({
      label: "ア",
      answer: ["0", "2"],
      points: 7,
      choices: 4,
      multi: true
    });
    expect(parsed.errors).toEqual([]);
  });

  it("reports missing grading metadata", () => {
    const parsed = parseAuthoringLatex(String.raw`\mark{イ}`);

    expect(parsed.errors).toContain("イ: 正解値 answer が未設定です。");
    expect(parsed.errors).toContain("イ: 配点 points は正の数で指定してください。");
  });

  it("renders custom mark and choice commands as preview controls", () => {
    const parsed = parseAuthoringLatex(String.raw`\mark[answer=1,points=4,choices=4]{ア}
\choice{ア}{1}{$-3$}`);

    expect(parsed.renderedHtml).toContain("class=\"latex-mark\"");
    expect(parsed.renderedHtml).toContain("class=\"latex-choice\"");
    expect(parsed.renderedHtml).not.toContain("&lt;span");
  });

  it("renders inline math segments as React nodes", () => {
    const nodes = renderMathSegments("関数 $x^2$ を考える。");

    expect(nodes.length).toBe(3);
  });

  it("keeps the anime default TeX answer marks aligned with the answer key", () => {
    const parsed = parseAuthoringLatex(defaultAuthoringSource);

    expect(parsed.marks.map((mark) => mark.answer[0])).toEqual(animeOnlymarkAnswerKey);
  });

  it("keeps the anime default TeX points aligned with the exam data", () => {
    const parsed = parseAuthoringLatex(defaultAuthoringSource);

    expect(parsed.marks.map((mark) => mark.points)).toEqual(animeOnlymarkExam.questions.map((question) => question.points));
  });
});
