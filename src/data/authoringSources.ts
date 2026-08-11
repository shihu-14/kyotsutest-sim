import type { Exam } from "../types";
import {
  animeOnlymarkAuthoringData,
  animeOnlymarkExamId,
  type ExamAuthoringData
} from "./exams/animeOnlymark2026/authoringSource";

const authoringDataByExamId: ReadonlyMap<string, ExamAuthoringData> = new Map([
  [animeOnlymarkExamId, animeOnlymarkAuthoringData]
]);

export function resolveAuthoringData(exam: Exam | null | undefined) {
  return {
    defaults: animeOnlymarkAuthoringData,
    examSource: exam ? authoringDataByExamId.get(exam.id) ?? null : animeOnlymarkAuthoringData
  };
}
