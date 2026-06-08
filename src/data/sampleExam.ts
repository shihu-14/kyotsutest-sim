import type { Exam, PageGradeAnchor, PageMarkArea } from "../types";
import animeCoverPage from "../assets/anime-pages/page-00.jpg";
import animePage01 from "../assets/anime-pages/page-01.jpg";
import animePage02 from "../assets/anime-pages/page-02.jpg";
import animePage03 from "../assets/anime-pages/page-03.jpg";
import animePage04 from "../assets/anime-pages/page-04.jpg";
import animePage05 from "../assets/anime-pages/page-05.jpg";
import animePage06 from "../assets/anime-pages/page-06.jpg";
import animePage07 from "../assets/anime-pages/page-07.jpg";
import animePage08 from "../assets/anime-pages/page-08.jpg";
import animePage09 from "../assets/anime-pages/page-09.jpg";
import animePage10 from "../assets/anime-pages/page-10.jpg";
import animePage11 from "../assets/anime-pages/page-11.jpg";
import animePage12 from "../assets/anime-pages/page-12.jpg";
import animePage13 from "../assets/anime-pages/page-13.jpg";
import mathIaCover from "../assets/math-ia-cover.svg";

const optionsFrom = (contents: string[]) =>
  contents.map((content, index) => {
    const value = String(index + 1);
    return { value, label: value, content };
  });

const commonOptions = [
  { value: "0", label: "0", content: "0" },
  { value: "1", label: "1", content: "1" },
  { value: "2", label: "2", content: "2" },
  { value: "3", label: "3", content: "3" },
  { value: "4", label: "4", content: "4" }
];

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

const animePageId = (pageNumber: number) => `anime-p${String(pageNumber).padStart(2, "0")}`;

const animePageWidth = 1247;
const animePageHeight = 1772;
const animeQuestionId = (questionNumber: number) => `anime-q${String(questionNumber).padStart(2, "0")}`;

function imageMarkArea(
  questionNumber: number,
  value: string,
  x: number,
  y: number,
  width = 36,
  height = 42
): PageMarkArea {
  return {
    questionId: animeQuestionId(questionNumber),
    value,
    xPercent: Number(((x / animePageWidth) * 100).toFixed(3)),
    yPercent: Number(((y / animePageHeight) * 100).toFixed(3)),
    widthPercent: Number(((width / animePageWidth) * 100).toFixed(3)),
    heightPercent: Number(((height / animePageHeight) * 100).toFixed(3))
  };
}

function imageMarkRow(questionNumber: number, y: number, values: string[], xs: number[]): PageMarkArea[] {
  return values.map((value, index) => imageMarkArea(questionNumber, value, xs[index], y));
}

function imageGradeAnchor(questionNumber: number, x: number, y: number, width = 120): PageGradeAnchor {
  return {
    questionId: animeQuestionId(questionNumber),
    xPercent: Number(((x / animePageWidth) * 100).toFixed(3)),
    yPercent: Number(((y / animePageHeight) * 100).toFixed(3)),
    widthPercent: Number(((width / animePageWidth) * 100).toFixed(3))
  };
}

const animeSmallChoices = ["1", "2", "3"];
const animeFourChoices = ["1", "2", "3", "4"];
const animeEightChoices = ["1", "2", "3", "4", "5", "6", "7", "8"];
const animeNineChoices = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const animePageMarkAreas: Record<number, PageMarkArea[]> = {
  1: [
    imageMarkArea(1, "1", 184, 1481),
    imageMarkArea(1, "2", 645, 1481),
    imageMarkArea(1, "3", 184, 1562.5),
    imageMarkArea(1, "4", 645, 1562.5)
  ],
  2: [imageMarkArea(2, "1", 222, 639.5), imageMarkArea(2, "2", 222, 1076)],
  3: [imageMarkArea(2, "3", 222, 147), imageMarkArea(2, "4", 222, 873)],
  4: [
    ...imageMarkRow(3, 872.5, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021]),
    ...imageMarkRow(4, 948.5, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021]),
    ...imageMarkRow(5, 1024, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021]),
    ...imageMarkRow(6, 1100, animeNineChoices, [658.5, 704, 749, 794, 840, 885, 930, 975.5, 1021])
  ],
  5: imageMarkRow(7, 1532, ["1", "2", "3", "4", "5"], [213, 397, 582, 766, 950]),
  6: imageMarkRow(8, 1302, animeEightChoices, [402, 473, 544, 615, 686, 756, 827, 897]),
  7: [
    ...imageMarkRow(9, 1121, animeFourChoices, [728, 773, 818, 863.5]),
    ...imageMarkRow(10, 1205, animeFourChoices, [728, 773, 818, 863.5]),
    ...imageMarkRow(11, 1289, animeFourChoices, [728, 773, 818, 863.5])
  ],
  8: [
    ...imageMarkRow(12, 704.5, animeSmallChoices, [237, 545, 852]),
    ...imageMarkRow(13, 1117.5, animeSmallChoices, [237, 545, 852]),
    ...imageMarkRow(14, 1521, animeSmallChoices, [237, 545, 852])
  ],
  9: [
    ...imageMarkRow(15, 438.5, animeSmallChoices, [693, 739, 784]),
    ...imageMarkRow(16, 517, animeSmallChoices, [693, 739, 784])
  ],
  10: imageMarkRow(17, 1563.5, animeFourChoices, [213, 420, 626.5, 833]),
  11: [
    ...imageMarkRow(18, 905, animeFourChoices, [237, 468, 698.5, 929]),
    ...imageMarkRow(19, 1579, animeFourChoices, [237, 468, 698.5, 929])
  ],
  12: imageMarkRow(20, 933.5, animeFourChoices, [204, 419, 635, 850])
};

const animePageGradeAnchors: Record<number, PageGradeAnchor[]> = {
  1: [imageGradeAnchor(1, 832, 318.5)],
  2: [imageGradeAnchor(2, 416, 495.5)],
  4: [
    imageGradeAnchor(3, 443, 873.5),
    imageGradeAnchor(4, 443, 949.5),
    imageGradeAnchor(5, 443, 1025.5),
    imageGradeAnchor(6, 443, 1101)
  ],
  5: [imageGradeAnchor(7, 703, 263.5)],
  6: [imageGradeAnchor(8, 1079, 312.5)],
  7: [
    imageGradeAnchor(9, 479.5, 1121.5),
    imageGradeAnchor(10, 479.5, 1205.5),
    imageGradeAnchor(11, 479.5, 1289.5)
  ],
  8: [
    imageGradeAnchor(12, 349, 392.5),
    imageGradeAnchor(13, 349, 805.5),
    imageGradeAnchor(14, 349, 1218.5)
  ],
  9: [imageGradeAnchor(15, 456, 436.5), imageGradeAnchor(16, 454.5, 515.5)],
  10: [imageGradeAnchor(17, 516, 262.5)],
  11: [imageGradeAnchor(18, 349, 389.5), imageGradeAnchor(19, 349, 1015.5)],
  12: [imageGradeAnchor(20, 976, 208.5)]
};

export const sampleExams: Exam[] = [
  {
    id: "math-ia-prototype-2026",
    title: "共通テスト形式 数学I・A 模試",
    subject: "数学I・A",
    durationMinutes: 70,
    published: true,
    totalPoints: 32,
    description: "二次関数、三角比、データの分析、場合の数を含む短時間確認用セット。",
    coverImageUrl: mathIaCover,
    instructions: [
      "解答は右側のマークシート、または問題冊子中の選択肢をクリックして行うこと。",
      "同じ選択肢を再度クリックすると、そのマークは取り消される。",
      "複数選択の設問では、指定されたすべての選択肢を選ぶこと。",
      "制限時間が終了すると自動的に採点へ移る。"
    ],
    pages: [
      {
        id: "p1",
        pageNumber: 1,
        title: "第1問 二次関数",
        blocks: [
          {
            type: "heading",
            text: "第1問 二次関数",
            level: 2
          },
          {
            type: "paragraph",
            text: "関数 $f(x)=x^2-4x+1$ について、次の問いに答えよ。"
          },
          {
            type: "formula",
            latex: "f(x)=(x-2)^2-3"
          },
          {
            type: "question",
            questionId: "q1"
          },
          {
            type: "question",
            questionId: "q2"
          },
          {
            type: "note",
            text: "必要があれば、平方完成によってグラフの頂点を確認してよい。"
          }
        ]
      },
      {
        id: "p2",
        pageNumber: 2,
        title: "第2問 三角比",
        blocks: [
          {
            type: "heading",
            text: "第2問 三角比",
            level: 2
          },
          {
            type: "paragraph",
            text: "鋭角 $\\theta$ が $\\sin \\theta=\\frac{3}{5}$ を満たすとする。"
          },
          {
            type: "figure",
            caption: "三角比の関係を示すTikZコード例",
            alt: "直角三角形のTikZコード",
            tikz: "\\begin{tikzpicture}\\draw (0,0)--(3,0)--(3,4)--cycle;\\end{tikzpicture}"
          },
          {
            type: "question",
            questionId: "q3"
          },
          {
            type: "question",
            questionId: "q4"
          }
        ]
      },
      {
        id: "p3",
        pageNumber: 3,
        title: "第3問 データの分析と場合の数",
        blocks: [
          {
            type: "heading",
            text: "第3問 データの分析と場合の数",
            level: 2
          },
          {
            type: "paragraph",
            text: "データ $2,4,6,8,10$ と、5枚のカード A, A, B, C, D について考える。"
          },
          {
            type: "question",
            questionId: "q5"
          },
          {
            type: "question",
            questionId: "q6"
          }
        ]
      }
    ],
    questions: [
      {
        id: "q1",
        label: "ア",
        section: "第1問",
        prompt: "$f(x)$ の最小値として正しいものを選べ。",
        pageId: "p1",
        points: 4,
        multi: false,
        options: [
          { value: "-4", label: "0", content: "$-4$" },
          { value: "-3", label: "1", content: "$-3$" },
          { value: "-2", label: "2", content: "$-2$" },
          { value: "1", label: "3", content: "$1$" }
        ],
        correct: ["-3"],
        explanation: "$f(x)=(x-2)^2-3$ であるから、最小値は $-3$ である。"
      },
      {
        id: "q2",
        label: "イ",
        section: "第1問",
        prompt: "$f(x)=0$ の2つの解の和を選べ。",
        pageId: "p1",
        points: 4,
        multi: false,
        options: commonOptions,
        correct: ["4"],
        explanation: "二次方程式 $x^2-4x+1=0$ の解の和は、係数より $4$ である。"
      },
      {
        id: "q3",
        label: "ウ",
        section: "第2問",
        prompt: "$\\cos \\theta$ の値を選べ。",
        pageId: "p2",
        points: 5,
        multi: false,
        options: [
          { value: "1/5", label: "0", content: "$\\frac{1}{5}$" },
          { value: "2/5", label: "1", content: "$\\frac{2}{5}$" },
          { value: "3/5", label: "2", content: "$\\frac{3}{5}$" },
          { value: "4/5", label: "3", content: "$\\frac{4}{5}$" }
        ],
        correct: ["4/5"],
        explanation: "$\\sin \\theta=3/5$ で鋭角なので、三平方の定理から $\\cos \\theta=4/5$。"
      },
      {
        id: "q4",
        label: "エ",
        section: "第2問",
        prompt: "$\\tan \\theta$ として正しいものを選べ。",
        pageId: "p2",
        points: 5,
        multi: false,
        options: [
          { value: "3/4", label: "0", content: "$\\frac{3}{4}$" },
          { value: "4/3", label: "1", content: "$\\frac{4}{3}$" },
          { value: "5/4", label: "2", content: "$\\frac{5}{4}$" },
          { value: "5/3", label: "3", content: "$\\frac{5}{3}$" }
        ],
        correct: ["3/4"],
        explanation: "$\\tan \\theta=\\sin \\theta / \\cos \\theta=(3/5)/(4/5)=3/4$。"
      },
      {
        id: "q5",
        label: "オ",
        section: "第3問",
        prompt: "データ $2,4,6,8,10$ について正しい記述をすべて選べ。",
        pageId: "p3",
        points: 7,
        multi: true,
        options: [
          { value: "mean6", label: "0", content: "平均値は $6$ である" },
          { value: "median8", label: "1", content: "中央値は $8$ である" },
          { value: "range8", label: "2", content: "範囲は $8$ である" },
          { value: "var10", label: "3", content: "分散は $10$ である" }
        ],
        correct: ["mean6", "range8"],
        explanation: "平均値は $6$、中央値は $6$、範囲は $10-2=8$ である。"
      },
      {
        id: "q6",
        label: "カ",
        section: "第3問",
        prompt: "5枚のカード A, A, B, C, D を1列に並べる方法の数を選べ。",
        pageId: "p3",
        points: 7,
        multi: false,
        options: [
          { value: "20", label: "0", content: "$20$" },
          { value: "30", label: "1", content: "$30$" },
          { value: "60", label: "2", content: "$60$" },
          { value: "120", label: "3", content: "$120$" }
        ],
        correct: ["60"],
        explanation: "Aが2枚同じなので、並べ方は $5!/2!=60$ 通り。"
      }
    ]
  },
  {
    id: "anime-onlymark-2026",
    title: "漫画映画",
    subject: "漫画映画",
    durationMinutes: 40,
    published: true,
    totalPoints: 100,
    description: "kyotutest_anime_onlymark.tex をもとにした、アニメ題材の共通テスト形式サンプル。",
    coverImageUrl: animeCoverPage,
    instructions: [
      "この問題冊子は、同一ディレクトリの kyotutest_anime_onlymark.tex をサンプル化したものです。",
      "解答は右側のマークシート、または問題冊子中の選択肢をクリックして行うこと。",
      "各大問の配点はTeX内の配点に合わせてあります。",
      "制限時間が終了すると自動的に採点へ移る。"
    ],
    pages: animePageImages.map((pageImageUrl, index) => ({
      id: animePageId(index + 1),
      pageNumber: index + 1,
      title: animePageTitles[index],
      pageImageUrl,
      pageImageAlt: `${animePageTitles[index]}のPDF再現ページ`,
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
  }
];
