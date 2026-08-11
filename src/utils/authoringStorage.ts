import type { AuthoringMeta } from "../types";

const AUTHOR_SOURCE_KEY = "kyotsu-test-sim:author-source";
const AUTHOR_META_KEY = "kyotsu-test-sim:author-meta";
const AUTHOR_ENVIRONMENT_KEY = "kyotsu-test-sim:author-environment";
const AUTHOR_COVER_KEY = "kyotsu-test-sim:author-cover";

export function saveAuthorSource(source: string): void {
  window.localStorage.setItem(AUTHOR_SOURCE_KEY, source);
}

export function loadAuthorSource(fallback: string): string {
  return window.localStorage.getItem(AUTHOR_SOURCE_KEY) ?? fallback;
}

export function saveAuthorEnvironment(source: string): void {
  window.localStorage.setItem(AUTHOR_ENVIRONMENT_KEY, source);
}

export function loadAuthorEnvironment(fallback: string): string {
  return window.localStorage.getItem(AUTHOR_ENVIRONMENT_KEY) ?? fallback;
}

export function saveAuthorCover(source: string): void {
  window.localStorage.setItem(AUTHOR_COVER_KEY, source);
}

export function loadAuthorCover(fallback: string): string {
  return window.localStorage.getItem(AUTHOR_COVER_KEY) ?? fallback;
}

export function saveAuthorMeta(meta: AuthoringMeta): void {
  window.localStorage.setItem(AUTHOR_META_KEY, JSON.stringify(meta));
}

export function loadAuthorMeta(fallback: AuthoringMeta): AuthoringMeta {
  const raw = window.localStorage.getItem(AUTHOR_META_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthoringMeta>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : fallback.title,
      subject: typeof parsed.subject === "string" ? parsed.subject : fallback.subject,
      description: typeof parsed.description === "string" ? parsed.description : fallback.description,
      questionCount: Number.isFinite(parsed.questionCount) ? Number(parsed.questionCount) : fallback.questionCount,
      totalPoints: Number.isFinite(parsed.totalPoints) ? Number(parsed.totalPoints) : fallback.totalPoints,
      durationMinutes: Number.isFinite(parsed.durationMinutes)
        ? Number(parsed.durationMinutes)
        : fallback.durationMinutes
    };
  } catch {
    return fallback;
  }
}
