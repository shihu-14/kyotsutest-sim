import { describe, expect, it } from "vitest";
import {
  countDraftMarks,
  getDraftMarkEntries,
  parseAuthoringDraft,
  serializeAuthoringDraft,
  sumDraftPoints
} from "./authoringDraft";

describe("authoring draft utilities", () => {
  it("splits source into sections, subsections, body, and marks", () => {
    const draft = parseAuthoringDraft(String.raw`\examtitle{Sample}
\sectiontitle{第1問}
本文A
\mark[answer=1,points=4,choices=4]{1}
\choice{1}{1}{Alpha}
\choice{1}{2}{Beta}
\subsectiontitle{問1}
本文B
\mark[answer=2|3,points=6,choices=5,multi=true]{2}`);

    expect(draft.sections).toHaveLength(1);
    expect(draft.sections[0].body).toBe("本文A");
    expect(draft.sections[0].marks[0]).toMatchObject({ label: "1", answer: "1", points: 4 });
    expect(draft.sections[0].marks[0].optionContents[0]).toMatchObject({ value: "1", content: "Alpha" });
    expect(draft.sections[0].marks[0].optionContents[1]).toMatchObject({ value: "2", content: "Beta" });
    expect(draft.sections[0].subsections[0].body).toBe("本文B");
    expect(getDraftMarkEntries(draft).map((entry) => entry.sectionTitle)).toEqual(["第1問", "第1問 問1"]);
    expect(countDraftMarks(draft)).toBe(2);
    expect(sumDraftPoints(draft)).toBe(10);
  });

  it("serializes structured draft back to authoring source", () => {
    const draft = parseAuthoringDraft(String.raw`\sectiontitle{第1問}
\subsectiontitle{問1}
\mark[answer=2,points=5,choices=4]{1}
\choice{1}{1}{A}
\choice{1}{2}{B}`);
    const source = serializeAuthoringDraft(
      {
        title: "Sample",
        subject: "Subject",
        description: "",
        questionCount: 1,
        totalPoints: 5,
        durationMinutes: 10
      },
      draft
    );

    expect(source).toContain("\\examtitle{Sample}");
    expect(source).toContain("\\sectiontitle{第1問}");
    expect(source).toContain("\\subsectiontitle{問1}");
    expect(source).toContain("\\mark[answer=2,points=5,choices=4]{1}");
    expect(source).toContain("\\choice{1}{1}{A}");
    expect(source).toContain("\\choice{1}{2}{B}");
  });

  it("keeps preview layout commands from pasted TeX preambles", () => {
    const draft = parseAuthoringDraft(String.raw`\documentclass[b5paper,12pt]{article}
\usepackage{graphicx}
\definecolor{beige}{RGB}{252,252,252}
\pagecolor{beige}
\linespread{1.5}
\geometry{inner=0.9in,outer=0.9in,top=50pt,bottom=0.76in}
\begin{document}
\nextmondai
本文C
\mark[answer=1,points=4,choices=4]{1}
\end{document}`);

    expect(draft.sections).toHaveLength(1);
    expect(draft.sections[0].title).toBe("第1問");
    expect(draft.sections[0].body).toContain("\\pagecolor{beige}");
    expect(draft.sections[0].body).toContain("\\geometry{inner=0.9in,outer=0.9in,top=50pt,bottom=0.76in}");
    expect(draft.sections[0].body).toContain("本文C");
    expect(draft.sections[0].body).not.toContain("\\usepackage");
  });
});
