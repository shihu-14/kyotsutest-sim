import type { Exam } from "../types";
import { animeOnlymarkExam } from "./exams/animeOnlymark2026";
import { mathIaPrototypeExam } from "./exams/mathIaPrototype";

export const sampleExams: Exam[] = [mathIaPrototypeExam, animeOnlymarkExam];
