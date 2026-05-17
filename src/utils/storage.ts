import type { AuthoringMeta, UserAnswers } from "../types";

const ANSWERS_PREFIX = "kyotsu-test-sim:answers:";
const DEADLINE_PREFIX = "kyotsu-test-sim:deadline:";
const AUTHOR_SOURCE_KEY = "kyotsu-test-sim:author-source";
const AUTHOR_META_KEY = "kyotsu-test-sim:author-meta";

export function loadAnswers(examId: string): UserAnswers {
  const raw = window.localStorage.getItem(`${ANSWERS_PREFIX}${examId}`);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAnswers(examId: string, answers: UserAnswers): void {
  window.localStorage.setItem(`${ANSWERS_PREFIX}${examId}`, JSON.stringify(answers));
}

export function clearAnswers(examId: string): void {
  window.localStorage.removeItem(`${ANSWERS_PREFIX}${examId}`);
}

export function saveDeadline(examId: string, deadline: number): void {
  window.localStorage.setItem(`${DEADLINE_PREFIX}${examId}`, String(deadline));
}

export function loadDeadline(examId: string): number | null {
  const raw = window.localStorage.getItem(`${DEADLINE_PREFIX}${examId}`);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearDeadline(examId: string): void {
  window.localStorage.removeItem(`${DEADLINE_PREFIX}${examId}`);
}

export function saveAuthorSource(source: string): void {
  window.localStorage.setItem(AUTHOR_SOURCE_KEY, source);
}

export function loadAuthorSource(fallback: string): string {
  return window.localStorage.getItem(AUTHOR_SOURCE_KEY) ?? fallback;
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
