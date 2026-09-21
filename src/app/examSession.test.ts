import { describe, expect, it } from "vitest";
import { imageExamFixture } from "../test/examFixtures";
import { examSessionReducer, initialExamSessionState, type ExamSessionState } from "./examSession";

describe("examSessionReducer", () => {
  it("models the select, cover, exam, scoring, review, and list transitions", () => {
    const savedAnswers = { [imageExamFixture.questions[0].id]: ["1"] };
    const cover = examSessionReducer(initialExamSessionState, {
      type: "OPEN_COVER",
      exam: imageExamFixture,
      answers: savedAnswers
    });
    expect(cover).toMatchObject({
      answers: savedAnswers,
      currentPageId: imageExamFixture.pages[0].id,
      deadline: null,
      phase: "cover",
      selectedExam: imageExamFixture
    });

    const exam = examSessionReducer(cover, { type: "START_EXAM", deadline: 123456 });
    expect(exam).toMatchObject({ answers: {}, deadline: 123456, phase: "exam" });

    const scoring = examSessionReducer(exam, { type: "FINISH_EXAM" });
    expect(scoring).toMatchObject({ deadline: null, phase: "scoring" });

    const review = examSessionReducer(scoring, { type: "ENTER_REVIEW" });
    expect(review).toMatchObject({
      currentPageId: imageExamFixture.pages[0].id,
      phase: "review"
    });

    const list = examSessionReducer(review, { type: "DISCARD_TO_LIST" });
    expect(list).toMatchObject({
      answers: {},
      currentPageId: "",
      deadline: null,
      phase: "select",
      selectedExam: null
    });
  });

  it("preserves the current answer retention difference between reset and discard", () => {
    const state: ExamSessionState = {
      ...initialExamSessionState,
      answers: { q1: ["2"] },
      selectedExam: imageExamFixture,
      phase: "cover"
    };

    expect(examSessionReducer(state, { type: "RESET_TO_LIST" }).answers).toEqual({ q1: ["2"] });
    expect(examSessionReducer(state, { type: "DISCARD_TO_LIST" }).answers).toEqual({});
  });

  it("keeps page and answer updates explicit", () => {
    const examState: ExamSessionState = {
      ...initialExamSessionState,
      phase: "exam",
      selectedExam: imageExamFixture
    };
    const pageState = examSessionReducer(examState, { type: "CHANGE_PAGE", pageId: "page-2" });
    const answeredState = examSessionReducer(pageState, {
      type: "TOGGLE_ANSWER",
      question: imageExamFixture.questions[0],
      value: imageExamFixture.questions[0].correct[0]
    });
    expect(answeredState.currentPageId).toBe("page-2");
    expect(answeredState.answers[imageExamFixture.questions[0].id]).toEqual([imageExamFixture.questions[0].correct[0]]);
  });
});
