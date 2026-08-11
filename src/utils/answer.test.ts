import { describe, expect, it } from "vitest";
import type { QuestionSlot } from "../types";
import { answersEqual, gradeExam, gradeQuestion, toggleAnswer } from "./answer";
import { animeOnlymarkExam } from "../data/exams/animeOnlymark2026";
import { structuredExamFixture } from "../test/examFixtures";

const multiQuestion: QuestionSlot = structuredExamFixture.questions.find((question) => question.multi)!;
const singleQuestion: QuestionSlot = structuredExamFixture.questions.find((question) => !question.multi)!;

describe("answer utilities", () => {
  it("toggles a single-select answer on and off", () => {
    expect(toggleAnswer(singleQuestion, [], "2")).toEqual(["2"]);
    expect(toggleAnswer(singleQuestion, ["2"], "2")).toEqual([]);
    expect(toggleAnswer(singleQuestion, ["2"], "1")).toEqual(["1"]);
  });

  it("keeps multi-select answers in option order", () => {
    const first = toggleAnswer(multiQuestion, [], "3");
    const second = toggleAnswer(multiQuestion, first, "1");

    expect(second).toEqual(["1", "3"]);
  });

  it("compares multi-select answers without depending on click order", () => {
    expect(answersEqual(["3", "1"], ["1", "3"], ["1", "2", "3", "4"])).toBe(true);
  });

  it("grades unanswered, incorrect, and correct questions", () => {
    expect(gradeQuestion(singleQuestion, []).status).toBe("unanswered");
    expect(gradeQuestion(singleQuestion, ["1"]).earnedPoints).toBe(0);
    expect(gradeQuestion(singleQuestion, ["2"]).earnedPoints).toBe(4);
  });

  it("sums the full exam score", () => {
    const summary = gradeExam(structuredExamFixture, {
      "fixture-q1": ["2"],
      "fixture-q2": ["3"],
      "fixture-q3": ["1", "3"]
    });

    expect(summary.totalScore).toBe(12);
    expect(summary.totalPoints).toBe(12);
  });

  it("grades the anime sample with the provided answer key", () => {
    const animeExam = animeOnlymarkExam;
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
