import { describe, expect, it } from "vitest";
import { structuredExamFixture } from "../test/examFixtures";
import { animeOnlymarkExam } from "./exams/animeOnlymark2026";
import { animeOnlymarkAuthoringData } from "./exams/animeOnlymark2026/authoringSource";
import { resolveAuthoringData } from "./authoringSources";

describe("authoringSources", () => {
  it("resolves exam-specific authoring data in the data layer", () => {
    expect(resolveAuthoringData(animeOnlymarkExam).examSource).toBe(animeOnlymarkAuthoringData);
    expect(resolveAuthoringData(structuredExamFixture).examSource).toBeNull();
    expect(resolveAuthoringData(null).examSource).toBe(animeOnlymarkAuthoringData);
  });
});
