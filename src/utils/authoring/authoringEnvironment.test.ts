import { beforeEach, describe, expect, it } from "vitest";
import { structuredExamFixture } from "../../test/examFixtures";
import {
  coverInstructionsFromSource,
  metaFromExam,
  parseEnvironmentEditorSource,
  serializeEnvironmentEditorSource
} from "./authoringEnvironment";

describe("authoringEnvironment", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips metadata, environment, and cover settings", () => {
    const meta = metaFromExam(structuredExamFixture);
    const serialized = serializeEnvironmentEditorSource(meta, "\\pagecolor{beige}", "\\item 注意事項");
    const parsed = parseEnvironmentEditorSource(serialized, meta, "fallback env", "fallback cover");

    expect(parsed).toEqual({
      meta,
      environmentSource: "\\pagecolor{beige}",
      coverSource: "\\item 注意事項"
    });
    expect(coverInstructionsFromSource(parsed.coverSource)).toEqual(["注意事項"]);
  });
});
