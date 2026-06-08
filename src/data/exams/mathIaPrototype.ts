import type { Exam } from "../../types";
import mathIaCover from "../../assets/exams/math-ia-prototype-2026/cover.svg";

const commonOptions = [
  { value: "0", label: "0", content: "0" },
  { value: "1", label: "1", content: "1" },
  { value: "2", label: "2", content: "2" },
  { value: "3", label: "3", content: "3" },
  { value: "4", label: "4", content: "4" }
];

export const mathIaPrototypeExam: Exam = {
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
};
