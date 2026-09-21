import type { Exam } from "../domain/exam";

const fourChoices = ["1", "2", "3", "4"].map((value) => ({
  value,
  label: value
}));

export const imageExamFixture: Exam = {
  id: "image-test-exam",
  title: "画像試験fixture",
  subject: "テスト",
  durationMinutes: 60,
  published: false,
  totalPoints: 12,
  coverImageUrl: "/fixture-cover.png",
  pages: [
    {
      id: "fixture-p1",
      pageNumber: 1,
      title: "第1問",
      pageImageUrl: "/fixture-page.png",
      markAreas: ["fixture-q1", "fixture-q2"].flatMap((questionId, row) =>
        fourChoices.map((option, column) => ({
          questionId,
          value: option.value,
          xPercent: 20 + column * 10,
          yPercent: 50 + row * 10
        }))
      ),
      gradeAnchors: ["fixture-q1", "fixture-q2"].map((questionId, row) => ({
        questionId,
        xPercent: 10,
        yPercent: 50 + row * 10
      }))
    },
    {
      id: "fixture-p2",
      pageNumber: 2,
      title: "第2問",
      pageImageUrl: "/fixture-page.png",
      markAreas: ["fixture-q3"].flatMap((questionId, row) =>
        fourChoices.map((option, column) => ({
          questionId,
          value: option.value,
          xPercent: 20 + column * 10,
          yPercent: 50 + row * 10
        }))
      ),
      gradeAnchors: ["fixture-q3"].map((questionId, row) => ({ questionId, xPercent: 10, yPercent: 50 + row * 10 }))
    }
  ],
  questions: [
    {
      id: "fixture-q1",
      label: "ア",
      section: "第1問",
      pageId: "fixture-p1",
      points: 4,
      multi: false,
      options: fourChoices,
      correct: ["2"]
    },
    {
      id: "fixture-q2",
      label: "イ",
      section: "第1問",
      pageId: "fixture-p1",
      points: 4,
      multi: false,
      options: fourChoices,
      correct: ["3"]
    },
    {
      id: "fixture-q3",
      label: "ウ",
      section: "第2問",
      pageId: "fixture-p2",
      points: 4,
      multi: true,
      options: fourChoices,
      correct: ["1", "3"]
    }
  ]
};
