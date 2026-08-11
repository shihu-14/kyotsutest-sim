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
  description: "kyotutest_anime_onlymark.tex をPDF化したページ画像をもとにした、アニメ題材の共通テスト形式サンプル。",
  coverImageUrl: animeCoverPage,
  coverMarkAreas: animeCoverMarkAreas,
  source: {
    kind: "latex-pdf",
    latexEntryPath: "src/assets/exams/anime-onlymark-2026/source/kyotutest_anime_onlymark.tex",
    pdfPath: "src/assets/exams/anime-onlymark-2026/source/kyotutest_anime_onlymark.pdf",
    pdfPageImagesPath: "src/assets/exams/anime-onlymark-2026/pdf-pages",
    markPlacement: "manual"
  },
  instructions: [
    "この問題冊子は、TeX原本をPDF化したページ画像をサンプル化したものです。",
    "解答は右側のマークシート、または問題冊子中の選択肢をクリックして行うこと。",
    "各大問の配点はTeX内の配点に合わせてあります。",
    "制限時間が終了すると自動的に採点へ移る。"
  ],
  pages: animePageImages.map((pageImageUrl, index) => ({
    id: animePageId(index + 1),
    pageNumber: index + 1,
    title: animePageTitles[index],
    pageImageUrl,
    pageImageAlt: `${animePageTitles[index]}のPDF変換ページ`,
    markAreas: animePageMarkAreas[index + 1] ?? [],
    gradeAnchors: animePageGradeAnchors[index + 1] ?? [],
    blocks: []
  })),
  questions: animeOnlymarkQuestions
};
