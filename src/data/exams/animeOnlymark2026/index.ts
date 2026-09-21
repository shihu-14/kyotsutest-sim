import type { Exam } from "../../../types";
import { animeCoverMarkAreas, animePageGradeAnchors, animePageId, animePageMarkAreas } from "./markLayout";
import { animeCoverPage, animePageImages, animePageTitles } from "./pageAssets";
import { animeOnlymarkQuestions } from "./questions";

export { animeOnlymarkAnswerKey } from "./answerKey";

export const animeOnlymarkExam: Exam = {
  id: "anime-onlymark-2026",
  title: "漫画映画",
  subject: "漫画映画",
  durationMinutes: 40,
  published: true,
  totalPoints: 100,
  coverImageUrl: animeCoverPage,
  coverMarkAreas: animeCoverMarkAreas,
  pages: animePageImages.map((pageImageUrl, index) => ({
    id: animePageId(index + 1),
    pageNumber: index + 1,
    title: animePageTitles[index],
    pageImageUrl,
    pageImageAlt: `${animePageTitles[index]}のPDF変換ページ`,
    markAreas: animePageMarkAreas[index + 1] ?? [],
    gradeAnchors: animePageGradeAnchors[index + 1] ?? []
  })),
  questions: animeOnlymarkQuestions
};
