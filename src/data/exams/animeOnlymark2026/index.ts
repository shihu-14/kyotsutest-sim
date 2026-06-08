import type { Exam } from "../../../types";
import animeCoverPage from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-00.jpg";
import animePage01 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-01.jpg";
import animePage02 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-02.jpg";
import animePage03 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-03.jpg";
import animePage04 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-04.jpg";
import animePage05 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-05.jpg";
import animePage06 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-06.jpg";
import animePage07 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-07.jpg";
import animePage08 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-08.jpg";
import animePage09 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-09.jpg";
import animePage10 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-10.jpg";
import animePage11 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-11.jpg";
import animePage12 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-12.jpg";
import animePage13 from "../../../assets/exams/anime-onlymark-2026/pdf-pages/page-13.jpg";
import { animePageGradeAnchors, animePageId, animePageMarkAreas } from "./markLayout";

const optionsFrom = (contents: string[]) =>
  contents.map((content, index) => {
    const value = String(index + 1);
    return { value, label: value, content };
  });

const animePageImages = [
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
  animePage13
];

const animePageTitles = [
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
  description: "kyotutest_anime_onlymark.tex をPDF化したページ画像をもとにした、アニメ題材の共通テスト形式サンプル。",
  coverImageUrl: animeCoverPage,
  source: {
    kind: "latex-pdf",
    latexEntryPath: "src/assets/exams/anime-onlymark-2026/source/kyotutest_anime_onlymark.tex",
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
  questions: [
      {
        id: "anime-q01",
        label: "1",
        section: "第1問",
        prompt: "式が表すアニメの名称として最も適当なものを選べ。",
        pageId: animePageId(1),
        points: 10,
        multi: false,
        options: optionsFrom(["おねがい☆ティーチャー", "オーバーロード", "オッドタクシー", "【推しの子】"]),
        correct: ["4"],
        explanation: "TeXサンプルの第1問に対応する解答欄です。"
      },
      {
        id: "anime-q02",
        label: "2",
        section: "第2問 問1",
        prompt: "学期末テストの最終問題として最も適当なものを選べ。",
        pageId: animePageId(2),
        points: 2,
        multi: false,
        options: optionsFrom(["ルベーグ積分", "食塩水", "体心立方格子", "放物線"]),
        correct: ["2"],
        explanation: "TeXサンプルの第2問 問1に対応する解答欄です。"
      },
      {
        id: "anime-q03",
        label: "3",
        section: "第2問 問2",
        prompt: "赤羽業に対応するコードネームを選べ。",
        pageId: animePageId(4),
        points: 2,
        multi: false,
        options: optionsFrom([
          "野球バカ",
          "鷹岡もどき",
          "コロコロ上がり",
          "中二半",
          "すごいサル",
          "女たらしクソ野郎",
          "性別",
          "ホームベース",
          "変態終末期"
        ]),
        correct: ["4"],
        explanation: "TeXサンプルの第2問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q04",
        label: "4",
        section: "第2問 問2",
        prompt: "潮田渚に対応するコードネームを選べ。",
        pageId: animePageId(4),
        points: 2,
        multi: false,
        options: optionsFrom([
          "野球バカ",
          "鷹岡もどき",
          "コロコロ上がり",
          "中二半",
          "すごいサル",
          "女たらしクソ野郎",
          "性別",
          "ホームベース",
          "変態終末期"
        ]),
        correct: ["7"],
        explanation: "TeXサンプルの第2問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q05",
        label: "5",
        section: "第2問 問2",
        prompt: "寺坂竜馬に対応するコードネームを選べ。",
        pageId: animePageId(4),
        points: 3,
        multi: false,
        options: optionsFrom([
          "野球バカ",
          "鷹岡もどき",
          "コロコロ上がり",
          "中二半",
          "すごいサル",
          "女たらしクソ野郎",
          "性別",
          "ホームベース",
          "変態終末期"
        ]),
        correct: ["2"],
        explanation: "TeXサンプルの第2問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q06",
        label: "6",
        section: "第2問 問2",
        prompt: "吉田大成に対応するコードネームを選べ。",
        pageId: animePageId(4),
        points: 3,
        multi: false,
        options: optionsFrom([
          "野球バカ",
          "鷹岡もどき",
          "コロコロ上がり",
          "中二半",
          "すごいサル",
          "女たらしクソ野郎",
          "性別",
          "ホームベース",
          "変態終末期"
        ]),
        correct: ["8"],
        explanation: "TeXサンプルの第2問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q07",
        label: "7",
        section: "第3問",
        prompt: "図中の X に入る最も適当な記号を選べ。",
        pageId: animePageId(5),
        points: 10,
        multi: false,
        options: optionsFrom(["$\\Omega$", "$\\alpha$", "$\\beta$", "$\\gamma$", "$\\delta$"]),
        correct: ["3"],
        explanation: "TeXサンプルの第3問に対応する解答欄です。"
      },
      {
        id: "anime-q08",
        label: "8",
        section: "第4問 問1",
        prompt: "要素 I から III の分類として最も適当なものを選べ。",
        pageId: animePageId(6),
        points: 4,
        multi: false,
        options: optionsFrom(["AAA", "AAĀ", "AĀA", "AĀĀ", "ĀAA", "ĀAĀ", "ĀĀA", "ĀĀĀ"]),
        correct: ["4"],
        explanation: "TeXサンプルの第4問 問1に対応する解答欄です。"
      },
      {
        id: "anime-q09",
        label: "9",
        section: "第4問 問2",
        prompt: "椎名真昼の分類として最も適当なものを選べ。",
        pageId: animePageId(7),
        points: 4,
        multi: false,
        options: optionsFrom(["A∩B", "Ā∩B", "A∩B̄", "Ā∩B̄"]),
        correct: ["4"],
        explanation: "TeXサンプルの第4問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q10",
        label: "10",
        section: "第4問 問2",
        prompt: "西森柚咲の分類として最も適当なものを選べ。",
        pageId: animePageId(7),
        points: 4,
        multi: false,
        options: optionsFrom(["A∩B", "Ā∩B", "A∩B̄", "Ā∩B̄"]),
        correct: ["1"],
        explanation: "TeXサンプルの第4問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q11",
        label: "11",
        section: "第4問 問2",
        prompt: "楪いのりの分類として最も適当なものを選べ。",
        pageId: animePageId(7),
        points: 4,
        multi: false,
        options: optionsFrom(["A∩B", "Ā∩B", "A∩B̄", "Ā∩B̄"]),
        correct: ["1"],
        explanation: "TeXサンプルの第4問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q12",
        label: "12",
        section: "第5問",
        prompt: "「天翼種」の読みとして最も適当なものを選べ。",
        pageId: animePageId(8),
        points: 4,
        multi: false,
        options: optionsFrom(["イマニティ", "フリューゲル", "ファンタズマ"]),
        correct: ["2"],
        explanation: "TeXサンプルの第5問 問1に対応する解答欄です。"
      },
      {
        id: "anime-q13",
        label: "13",
        section: "第5問",
        prompt: "「智慧之王」の読みとして最も適当なものを選べ。",
        pageId: animePageId(8),
        points: 3,
        multi: false,
        options: optionsFrom(["ラファエル", "メタトロン", "ガブリエル"]),
        correct: ["1"],
        explanation: "TeXサンプルの第5問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q14",
        label: "14",
        section: "第5問",
        prompt: "「超能力者」の読みとして最も適当なものを選べ。",
        pageId: animePageId(8),
        points: 3,
        multi: false,
        options: optionsFrom(["レベル1", "レベル5", "レベル6"]),
        correct: ["2"],
        explanation: "TeXサンプルの第5問 問3に対応する解答欄です。"
      },
      {
        id: "anime-q15",
        label: "15",
        section: "第6問",
        prompt: "A と B の関係として最も適当な記号を選べ。",
        pageId: animePageId(9),
        points: 5,
        multi: false,
        options: optionsFrom(["<", "=", ">"]),
        correct: ["3"],
        explanation: "TeXサンプルの第6問に対応する解答欄です。"
      },
      {
        id: "anime-q16",
        label: "16",
        section: "第6問",
        prompt: "C と D の関係として最も適当な記号を選べ。",
        pageId: animePageId(9),
        points: 5,
        multi: false,
        options: optionsFrom(["<", "=", ">"]),
        correct: ["1"],
        explanation: "TeXサンプルの第6問に対応する解答欄です。"
      },
      {
        id: "anime-q17",
        label: "17",
        section: "第7問",
        prompt: "口コミの内容に該当するアニメとして最も適当なものを選べ。",
        pageId: animePageId(10),
        points: 10,
        multi: false,
        options: optionsFrom(["化物語", "虚構推理", "呪術廻戦", "モブサイコ100"]),
        correct: ["1"],
        explanation: "TeXサンプルの第7問に対応する解答欄です。"
      },
      {
        id: "anime-q18",
        label: "18",
        section: "第8問",
        prompt: "問1の説明が意味する単語として最も適当なものを選べ。",
        pageId: animePageId(11),
        points: 6,
        multi: false,
        options: optionsFrom(["isekai", "romcom", "yuri", "catgirl"]),
        correct: ["3"],
        explanation: "TeXサンプルの第8問 問1に対応する解答欄です。"
      },
      {
        id: "anime-q19",
        label: "19",
        section: "第8問",
        prompt: "問2の説明が意味する単語として最も適当なものを選べ。",
        pageId: animePageId(11),
        points: 6,
        multi: false,
        options: optionsFrom(["manga", "lightnovel", "comiket", "doujinshi"]),
        correct: ["4"],
        explanation: "TeXサンプルの第8問 問2に対応する解答欄です。"
      },
      {
        id: "anime-q20",
        label: "20",
        section: "第9問",
        prompt: "空欄に当てはまる単語として最も適当なものを選べ。",
        pageId: animePageId(12),
        points: 10,
        multi: false,
        options: optionsFrom(["scoff", "despise", "inferior", "underestimate"]),
        correct: ["4"],
        explanation: "TeXサンプルの第9問に対応する解答欄です。"
      }
    ]
};
