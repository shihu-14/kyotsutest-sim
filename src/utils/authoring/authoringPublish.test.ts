import { describe, expect, it } from "vitest";
import { structuredExamFixture } from "../../test/examFixtures";
import {
  coverSourceFromExam,
  environmentFromExam,
  metaFromExam
} from "./authoringEnvironment";
import { buildPublishedExam, sourceFromExam } from "./authoringPublish";

describe("authoringPublish", () => {
  it("publishes an existing structured exam without changing its authored meaning", () => {
    const fallbackMeta = {
      title: "",
      subject: "",
      description: "",
      questionCount: 0,
      totalPoints: 0,
      durationMinutes: 0
    };
    const source = sourceFromExam(structuredExamFixture, { meta: fallbackMeta, source: "" }, null);
    const published = buildPublishedExam(
      metaFromExam(structuredExamFixture, fallbackMeta),
      source,
      structuredExamFixture,
      environmentFromExam(structuredExamFixture, ""),
      coverSourceFromExam(structuredExamFixture, "")
    );

    expect(published).toMatchObject({
      id: structuredExamFixture.id,
      title: structuredExamFixture.title,
      subject: structuredExamFixture.subject,
      durationMinutes: structuredExamFixture.durationMinutes,
      totalPoints: structuredExamFixture.totalPoints,
      published: true
    });
    expect(published.questions).toHaveLength(structuredExamFixture.questions.length);
    expect(
      published.questions.map(({ label, points, multi, correct }) => ({ label, points, multi, correct }))
    ).toEqual(
      structuredExamFixture.questions.map(({ label, points, multi, correct }) => ({ label, points, multi, correct }))
    );
    expect(published.pages.map((page) => page.title)).toEqual(
      structuredExamFixture.pages.map((page) => page.title)
    );
  });
});
