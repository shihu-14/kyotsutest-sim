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
\subsectiontitle{問1}
本文B
\mark[answer=2|3,points=6,choices=5,multi=true]{2}`);

    expect(draft.sections).toHaveLength(1);
    expect(draft.sections[0].body).toBe("本文A");
    expect(draft.sections[0].marks[0]).toMatchObject({ label: "1", answer: "1", points: 4 });
    expect(draft.sections[0].subsections[0].body).toBe("本文B");
    expect(getDraftMarkEntries(draft).map((entry) => entry.sectionTitle)).toEqual(["第1問", "第1問 問1"]);
    expect(countDraftMarks(draft)).toBe(2);
    expect(sumDraftPoints(draft)).toBe(10);
  });

  it("serializes structured draft back to authoring source", () => {
    const draft = parseAuthoringDraft(String.raw`\sectiontitle{第1問}
\subsectiontitle{問1}
\mark[answer=2,points=5,choices=4]{1}`);
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
  });
});
