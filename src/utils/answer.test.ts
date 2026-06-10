import { describe, expect, it } from "vitest";
import type { QuestionSlot } from "../types";
import { answersEqual, gradeExam, gradeQuestion, toggleAnswer } from "./answer";
import { sampleExams } from "../data/sampleExam";

const multiQuestion: QuestionSlot = sampleExams[0].questions.find((question) => question.id === "q5")!;
const singleQuestion: QuestionSlot = sampleExams[0].questions.find((question) => question.id === "q1")!;

describe("answer utilities", () => {
  it("toggles a single-select answer on and off", () => {
    expect(toggleAnswer(singleQuestion, [], "-3")).toEqual(["-3"]);
    expect(toggleAnswer(singleQuestion, ["-3"], "-3")).toEqual([]);
    expect(toggleAnswer(singleQuestion, ["-3"], "-2")).toEqual(["-2"]);
  });

  it("keeps multi-select answers in option order", () => {
    const first = toggleAnswer(multiQuestion, [], "range8");
    const second = toggleAnswer(multiQuestion, first, "mean6");

    expect(second).toEqual(["mean6", "range8"]);
  });

  it("compares multi-select answers without depending on click order", () => {
    expect(answersEqual(["range8", "mean6"], ["mean6", "range8"], ["mean6", "median8", "range8"])).toBe(true);
  });

  it("grades unanswered, incorrect, and correct questions", () => {
    expect(gradeQuestion(singleQuestion, []).status).toBe("unanswered");
    expect(gradeQuestion(singleQuestion, ["-2"]).earnedPoints).toBe(0);
    expect(gradeQuestion(singleQuestion, ["-3"]).earnedPoints).toBe(4);
  });

  it("sums the full exam score", () => {
    const summary = gradeExam(sampleExams[0], {
      q1: ["-3"],
      q2: ["4"],
      q3: ["4/5"],
      q4: ["3/4"],
      q5: ["mean6", "range8"],
      q6: ["60"]
    });

    expect(summary.totalScore).toBe(32);
    expect(summary.totalPoints).toBe(32);
  });

  it("grades the anime sample with the provided answer key", () => {
    const animeExam = sampleExams.find((exam) => exam.id === "anime-onlymark-2026")!;
    const answerKey = [
      "1",
      "3",
      "4",
      "7",
      "2",
      "8",
      "3",
      "6",
      "4",
      "2",
      "1",
      "3",
      "3",
      "2",
      "1",
      "2",
      "1",
      "2",
      "4",
      "2",
      "3"
    ];
    const answers = Object.fromEntries(animeExam.questions.map((question, index) => [question.id, [answerKey[index]]]));
    const summary = gradeExam(animeExam, answers);

    expect(animeExam.questions.map((question) => question.correct[0])).toEqual(answerKey);
    expect(summary.gradedQuestions.every((question) => question.isCorrect)).toBe(true);
    expect(summary.totalScore).toBe(100);
    expect(summary.totalPoints).toBe(100);
  });
});
