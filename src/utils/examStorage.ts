import type { UserAnswers } from "../types";

const ANSWERS_PREFIX = "kyotsu-test-sim:answers:";
const DEADLINE_PREFIX = "kyotsu-test-sim:deadline:";

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

export function clearDeadline(examId: string): void {
  window.localStorage.removeItem(`${DEADLINE_PREFIX}${examId}`);
}
