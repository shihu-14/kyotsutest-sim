import { beforeEach, describe, expect, it } from "vitest";
import type { AuthoringMeta } from "../../types";
import {
  loadAuthorCover,
  loadAuthorEnvironment,
  loadAuthorMeta,
  loadAuthorSource,
  saveAuthorCover,
  saveAuthorEnvironment,
  saveAuthorMeta,
  saveAuthorSource
} from "./authoringStorage";

const meta: AuthoringMeta = {
  title: "試験",
  subject: "科目",
  description: "説明",
  questionCount: 3,
  totalPoints: 12,
  durationMinutes: 60
};

describe("authoringStorage", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps the existing authoring storage keys and values", () => {
    saveAuthorSource("source");
    saveAuthorEnvironment("environment");
    saveAuthorCover("cover");
    saveAuthorMeta(meta);

    expect(loadAuthorSource("fallback")).toBe("source");
    expect(loadAuthorEnvironment("fallback")).toBe("environment");
    expect(loadAuthorCover("fallback")).toBe("cover");
    expect(loadAuthorMeta({ ...meta, title: "fallback" })).toEqual(meta);
  });
});
