import { describe, expect, it } from "vitest";
import { structuredExamFixture } from "../test/examFixtures";
import {
  examSessionReducer,
  initialExamSessionState,
  type ExamSessionState
} from "./examSession";

describe("examSessionReducer", () => {
  it("models the select, cover, exam, scoring, review, and list transitions", () => {
    const savedAnswers = { [structuredExamFixture.questions[0].id]: ["1"] };
    const cover = examSessionReducer(initialExamSessionState, {
      type: "OPEN_COVER",
      exam: structuredExamFixture,
      answers: savedAnswers
    });
    expect(cover).toMatchObject({
      answers: savedAnswers,
      currentPageId: structuredExamFixture.pages[0].id,
      deadline: null,
      phase: "cover",
      selectedExam: structuredExamFixture
    });

    const exam = examSessionReducer(cover, { type: "START_EXAM", deadline: 123456 });
    expect(exam).toMatchObject({ answers: {}, deadline: 123456, phase: "exam" });

    const scoring = examSessionReducer(exam, { type: "FINISH_EXAM" });
    expect(scoring).toMatchObject({ deadline: null, phase: "scoring", showCompletedScoring: false });

    const review = examSessionReducer(scoring, { type: "ENTER_REVIEW" });
    expect(review).toMatchObject({
      currentPageId: structuredExamFixture.pages[0].id,
      phase: "review",
      showCompletedScoring: true
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
      selectedExam: structuredExamFixture,
      phase: "cover"
    };

    expect(examSessionReducer(state, { type: "RESET_TO_LIST" }).answers).toEqual({ q1: ["2"] });
    expect(examSessionReducer(state, { type: "DISCARD_TO_LIST" }).answers).toEqual({});
  });

  it("keeps editor, page, and answer updates explicit", () => {
    const editorState = examSessionReducer(initialExamSessionState, {
      type: "OPEN_EDITOR",
      exam: structuredExamFixture
    });
    expect(editorState).toMatchObject({ editingExam: structuredExamFixture, phase: "editor" });
    expect(examSessionReducer(editorState, { type: "CLOSE_EDITOR" })).toMatchObject({
      editingExam: null,
      phase: "select"
    });

    const examState: ExamSessionState = {
      ...initialExamSessionState,
      phase: "exam",
      selectedExam: structuredExamFixture
    };
    const pageState = examSessionReducer(examState, { type: "CHANGE_PAGE", pageId: "page-2" });
    const answeredState = examSessionReducer(pageState, {
      type: "TOGGLE_ANSWER",
      question: structuredExamFixture.questions[0],
      value: structuredExamFixture.questions[0].correct[0]
    });
    expect(answeredState.currentPageId).toBe("page-2");
    expect(answeredState.answers[structuredExamFixture.questions[0].id]).toEqual([
      structuredExamFixture.questions[0].correct[0]
    ]);
  });
});
