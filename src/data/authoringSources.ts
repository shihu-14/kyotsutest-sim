import type { AuthoringMeta, Exam } from "../types";
import { animeOnlymarkExam } from "./exams/animeOnlymark2026";
import { animeOnlymarkAuthoringData } from "./exams/animeOnlymark2026/authoringSource";

interface ExamAuthoringData {
  meta: AuthoringMeta;
  source: string;
  environmentSource: string;
  coverSource: string;
}

const authoringDataByExamId: ReadonlyMap<string, ExamAuthoringData> = new Map([
  [animeOnlymarkExam.id, animeOnlymarkAuthoringData]
]);

export function resolveAuthoringData(exam: Exam | null | undefined) {
  return {
    defaults: animeOnlymarkAuthoringData,
    examSource: exam ? authoringDataByExamId.get(exam.id) ?? null : animeOnlymarkAuthoringData
  };
}
