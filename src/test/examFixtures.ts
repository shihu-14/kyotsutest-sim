import type { Exam } from "../types";

const fourChoices = ["1", "2", "3", "4"].map((value) => ({
  value,
  label: value,
  content: `選択肢${value}`
}));

export const structuredExamFixture: Exam = {
  id: "structured-test-exam",
  title: "構造化試験fixture",
  subject: "テスト",
  durationMinutes: 60,
  published: false,
  totalPoints: 12,
  description: "構造化された問題表示を検証するためのテスト専用fixture。",
  coverImageUrl: "/fixture-cover.png",
  source: {
    kind: "structured",
    markPlacement: "generated"
  },
  instructions: [],
  pages: [
    {
      id: "fixture-p1",
      pageNumber: 1,
      title: "第1問",
      blocks: [
        { type: "heading", text: "第1問", level: 2 },
        { type: "question", questionId: "fixture-q1" },
        { type: "question", questionId: "fixture-q2" }
      ]
    },
    {
      id: "fixture-p2",
      pageNumber: 2,
      title: "第2問",
      blocks: [
        { type: "heading", text: "第2問", level: 2 },
        { type: "question", questionId: "fixture-q3" }
      ]
    }
  ],
  questions: [
    {
      id: "fixture-q1",
      label: "ア",
      section: "第1問",
      prompt: "正しい選択肢を選べ。",
      pageId: "fixture-p1",
      points: 4,
      multi: false,
      options: fourChoices,
      correct: ["2"],
      explanation: "正解は2。"
    },
    {
      id: "fixture-q2",
      label: "イ",
      section: "第1問",
      prompt: "正しい選択肢を選べ。",
      pageId: "fixture-p1",
      points: 4,
      multi: false,
      options: fourChoices,
      correct: ["3"],
      explanation: "正解は3。"
    },
    {
      id: "fixture-q3",
      label: "ウ",
      section: "第2問",
      prompt: "正しい選択肢をすべて選べ。",
      pageId: "fixture-p2",
      points: 4,
      multi: true,
      options: fourChoices,
      correct: ["1", "3"],
      explanation: "正解は1と3。"
    }
  ]
};
