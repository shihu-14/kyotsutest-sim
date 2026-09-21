import type { Exam } from "../../../domain/exam";
import animeCoverPage from "./pdf-pages/page-00.jpg";
import animePage01 from "./pdf-pages/page-01.jpg";
import animePage02 from "./pdf-pages/page-02.jpg";
import animePage03 from "./pdf-pages/page-03.jpg";
import animePage04 from "./pdf-pages/page-04.jpg";
import animePage05 from "./pdf-pages/page-05.jpg";
import animePage06 from "./pdf-pages/page-06.jpg";
import animePage07 from "./pdf-pages/page-07.jpg";
import animePage08 from "./pdf-pages/page-08.jpg";
import animePage09 from "./pdf-pages/page-09.jpg";
import animePage10 from "./pdf-pages/page-10.jpg";
import animePage11 from "./pdf-pages/page-11.jpg";
import animePage12 from "./pdf-pages/page-12.jpg";
import animePage13 from "./pdf-pages/page-13.jpg";
import animePage14 from "./pdf-pages/page-14.jpg";
import { animeCoverMarkAreas, animePageGradeAnchors, animePageId, animePageMarkAreas } from "./markLayout";
import { animeOnlymarkQuestions } from "./questions";

export const animePageImages = [
  animePage01,
  animePage02,
  animePage03,
  animePage04,
  animePage05,
  animePage06,
  animePage07,
  animePage08,
  animePage09,
  animePage10,
  animePage11,
  animePage12,
  animePage13,
  animePage14
];

export const animePageTitles = [
  "第1問 方程式クイズ",
  "第2問 暗殺教室 問1",
  "第2問 暗殺教室 問1 続き",
  "第2問 暗殺教室 問2",
  "第3問 グラフと年表",
  "第4問 集合 問1",
  "第4問 集合 問2",
  "第5問 漢字読み",
  "第6問 順序関係",
  "第7問 口コミ",
  "第8問 英英辞典",
  "第8問 英英辞典 続き",
  "第9問 英文クイズ",
  "キャラクター一覧"
];

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

export const initialExams: Exam[] = [animeOnlymarkExam];
