import type { AuthoringMeta, Exam } from "../types";
import {
  defaultAuthoringMeta,
  defaultCoverSource,
  defaultEnvironmentSource
} from "./authoringDefaults";
import { normalizePreviewText } from "./authoringPreview";
import { loadAuthorCover, loadAuthorEnvironment, loadAuthorMeta } from "./authoringStorage";

const animeSampleExamId = "anime-onlymark-2026";
const coverInstructionsBlockPattern = /\\begin\{coverinstructions\}([\s\S]*?)\\end\{coverinstructions\}/;

export function sameMeta(left: AuthoringMeta, right: AuthoringMeta): boolean {
  return (
    left.title === right.title &&
    left.subject === right.subject &&
    left.description === right.description &&
    left.questionCount === right.questionCount &&
    left.totalPoints === right.totalPoints &&
    left.durationMinutes === right.durationMinutes
  );
}

export function metaFromExam(exam: Exam | null | undefined): AuthoringMeta {
  if (!exam) {
    return loadAuthorMeta(defaultAuthoringMeta);
  }

  return {
    title: exam.title,
    subject: exam.subject,
    description: exam.description,
    questionCount: exam.questions.length,
    totalPoints: exam.totalPoints,
    durationMinutes: exam.durationMinutes
  };
}

export function environmentFromExam(exam: Exam | null | undefined): string {
  if (!exam) {
    return loadAuthorEnvironment(defaultEnvironmentSource);
  }

  return defaultEnvironmentSource;
}

export function coverSourceFromExam(exam: Exam | null | undefined): string {
  if (!exam) {
    return loadAuthorCover(defaultCoverSource);
  }

  if (exam.id === animeSampleExamId) {
    return defaultCoverSource;
  }

  return exam.instructions.map((instruction) => `\\item ${instruction}`).join("\n") || defaultCoverSource;
}

export function coverInstructionsFromSource(source: string): string[] {
  const instructions = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("%"))
    .filter((line) => !/^\\(?:begin|end)\{enumerate\}/.test(line))
    .map((line) => normalizePreviewText(line.replace(/^\\item\s*/, "")))
    .filter(Boolean);

  return instructions.length
    ? instructions
    : defaultCoverSource.split("\n").map((line) => normalizePreviewText(line.replace(/^\\item\s*/, "")));
}

function escapeSettingValue(value: string): string {
  return value.replace(/[{}]/g, "");
}

export function serializeEnvironmentEditorSource(
  meta: AuthoringMeta,
  environmentSource: string,
  coverSource: string
): string {
  return [
    "% === 試験設定 ===",
    `\\examtitle{${escapeSettingValue(meta.title)}}`,
    `\\examsubject{${escapeSettingValue(meta.subject)}}`,
    `\\examdescription{${escapeSettingValue(meta.description)}}`,
    `\\questioncount{${meta.questionCount}}`,
    `\\totalpoints{${meta.totalPoints}}`,
    `\\durationminutes{${meta.durationMinutes}}`,
    "",
    "% === preview環境 ===",
    environmentSource.trim(),
    "",
    "% === 表紙注意事項 ===",
    "\\begin{coverinstructions}",
    coverSource.trim(),
    "\\end{coverinstructions}"
  ].join("\n");
}

function readBracedCommand(source: string, command: string): string | null {
  const match = source.match(new RegExp(`\\\\${command}\\{([^}]*)\\}`));
  return match?.[1] ?? null;
}

function readPositiveNumberCommand(source: string, command: string, fallback: number): number {
  const value = Number(readBracedCommand(source, command));
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function parseEnvironmentEditorSource(
  source: string,
  fallbackMeta: AuthoringMeta,
  fallbackEnvironmentSource: string,
  fallbackCoverSource: string
) {
  const coverMatch = source.match(coverInstructionsBlockPattern);
  const nextCoverSource = coverMatch?.[1]?.trim() || fallbackCoverSource;
  const nextMeta: AuthoringMeta = {
    title: readBracedCommand(source, "examtitle") ?? fallbackMeta.title,
    subject: readBracedCommand(source, "examsubject") ?? fallbackMeta.subject,
    description: readBracedCommand(source, "examdescription") ?? fallbackMeta.description,
    questionCount: readPositiveNumberCommand(source, "questioncount", fallbackMeta.questionCount),
    totalPoints: readPositiveNumberCommand(source, "totalpoints", fallbackMeta.totalPoints),
    durationMinutes: readPositiveNumberCommand(source, "durationminutes", fallbackMeta.durationMinutes)
  };
  const nextEnvironmentSource = source
    .replace(coverInstructionsBlockPattern, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("%"))
    .filter((line) => !/^\\(?:examtitle|examsubject|examdescription|questioncount|totalpoints|durationminutes)\{/.test(line))
    .join("\n");

  return {
    meta: nextMeta,
    environmentSource: nextEnvironmentSource || fallbackEnvironmentSource,
    coverSource: nextCoverSource
  };
}
