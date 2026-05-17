import type { Exam } from "../types";
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
    coverImageUrl: mathIaCover,
    instructions: [
      "この問題冊子は、同一ディレクトリの kyotutest_anime_onlymark.tex をサンプル化したものです。",
      "解答は右側のマークシート、または問題冊子中の選択肢をクリックして行うこと。",
      "各大問の配点はTeX内の配点に合わせてあります。",
      "制限時間が終了すると自動的に採点へ移る。"
    ],
    pages: [
      {
        id: "anime-p1",
        pageNumber: 1,
        title: "第1問 方程式クイズ",
        blocks: [
          { type: "heading", text: "第1問 方程式クイズ", level: 2 },
          {
            type: "paragraph",
            text: "各式 1 から 3 が画像 I から III に示されたアニメの名称の一部を表している。式が表すアニメの名称として最も適当なものを選べ。"
          },
          {
            type: "formula",
            latex: "\\left\\{\\begin{aligned}y-x_n&=ci\\\\fg''&=c\\\\pb\\times abq^\\circ&=_d\\ t\\end{aligned}\\right."
          },
          { type: "question", questionId: "anime-q1" }
        ]
      },
      {
        id: "anime-p2",
        pageNumber: 2,
        title: "第2問 暗殺教室",
        blocks: [
          { type: "heading", text: "第2問 暗殺教室", level: 2 },
          {
            type: "paragraph",
            text: "暗殺教室に関する問い。学期末テストの最終問題や、登場人物のコードネームに関する内容を考える。"
          },
          { type: "question", questionId: "anime-q2" }
        ]
      },
      {
        id: "anime-p3",
        pageNumber: 3,
        title: "第3問 グラフと年表",
        blocks: [
          { type: "heading", text: "第3問 グラフと年表", level: 2 },
          {
            type: "paragraph",
            text: "グラフおよび図は、あるアニメに関するものである。これらの内容に基づいて X に入る最も適当な記号を選べ。"
          },
          { type: "question", questionId: "anime-q3" }
        ]
      },
      {
        id: "anime-p4",
        pageNumber: 4,
        title: "第4問 集合",
        blocks: [
          { type: "heading", text: "第4問 集合", level: 2 },
          {
            type: "paragraph",
            text: "ベン図が与えられたとき、要素 I から III の分類として最も適当なものを選べ。"
          },
          { type: "question", questionId: "anime-q4" }
        ]
      },
      {
        id: "anime-p5",
        pageNumber: 5,
        title: "第5問 漢字読み",
        blocks: [
          { type: "heading", text: "第5問 漢字読み", level: 2 },
          {
            type: "paragraph",
            text: "下線部の漢字に相当する読みとして最も適当なものを選べ。対象は、天翼種、智慧之王、超能力者である。"
          },
          { type: "question", questionId: "anime-q5" }
        ]
      },
      {
        id: "anime-p6",
        pageNumber: 6,
        title: "第6問 順序関係",
        blocks: [
          { type: "heading", text: "第6問 順序関係", level: 2 },
          {
            type: "paragraph",
            text: "画像 I から VI について、I < II = III < IV < V << VI が成り立つとき、A と B、C と D の関係として最も適当な記号を選べ。"
          },
          { type: "question", questionId: "anime-q6" }
        ]
      },
      {
        id: "anime-p7",
        pageNumber: 7,
        title: "第7問 口コミ",
        blocks: [
          { type: "heading", text: "第7問 口コミ", level: 2 },
          {
            type: "paragraph",
            text: "複数の口コミ文の内容に該当するアニメとして最も適当なものを選べ。"
          },
          { type: "question", questionId: "anime-q7" }
        ]
      },
      {
        id: "anime-p8",
        pageNumber: 8,
        title: "第8問 英英辞典",
        blocks: [
          { type: "heading", text: "第8問 英英辞典", level: 2 },
          {
            type: "paragraph",
            text: "英語版Wikipediaにも掲載されているアニメに関する単語の説明を読み、その説明が意味する単語を選べ。"
          },
          { type: "question", questionId: "anime-q8" }
        ]
      },
      {
        id: "anime-p9",
        pageNumber: 9,
        title: "第9問 英文クイズ",
        blocks: [
          { type: "heading", text: "第9問 英文クイズ", level: 2 },
          {
            type: "paragraph",
            text: "「ノーゲーム・ノーライフ」に登場するゲームの場面を描いた英文について、空欄に当てはまる単語を選べ。"
          },
          { type: "question", questionId: "anime-q9" }
        ]
      }
    ],
    questions: [
      {
        id: "anime-q1",
        label: "1",
        section: "第1問",
        prompt: "式が表すアニメの名称として最も適当なものを選べ。",
        pageId: "anime-p1",
        points: 10,
        multi: false,
        options: optionsFrom(["おねがい☆ティーチャー", "オーバーロード", "オッドタクシー", "【推しの子】"]),
        correct: ["4"],
        explanation: "TeXサンプルの第1問に対応する解答欄です。"
      },
      {
        id: "anime-q2",
        label: "2",
        section: "第2問",
        prompt: "暗殺教室に関する問いの組合せとして最も適当なものを選べ。",
        pageId: "anime-p2",
        points: 12,
        multi: false,
        options: optionsFrom(["ルベーグ積分と野球バカ", "食塩水とコロコロ上がり", "体心立方格子と性別", "放物線とホームベース"]),
        correct: ["2"],
        explanation: "TeXサンプルの第2問に対応する解答欄です。"
      },
      {
        id: "anime-q3",
        label: "3",
        section: "第3問",
        prompt: "図中の X に入る最も適当な記号を選べ。",
        pageId: "anime-p3",
        points: 10,
        multi: false,
        options: optionsFrom(["$\\Omega$", "$\\alpha$", "$\\beta$", "$\\gamma$", "$\\delta$"]),
        correct: ["3"],
        explanation: "TeXサンプルの第3問に対応する解答欄です。"
      },
      {
        id: "anime-q4",
        label: "4",
        section: "第4問",
        prompt: "ベン図における要素の分類として最も適当なものを選べ。",
        pageId: "anime-p4",
        points: 16,
        multi: false,
        options: optionsFrom(["AAA", "AAĀ", "AĀA", "AĀĀ", "ĀAA", "ĀAĀ", "ĀĀA", "ĀĀĀ"]),
        correct: ["4"],
        explanation: "TeXサンプルの第4問に対応する解答欄です。"
      },
      {
        id: "anime-q5",
        label: "5",
        section: "第5問",
        prompt: "下線部の読みの組合せとして最も適当なものを選べ。",
        pageId: "anime-p5",
        points: 10,
        multi: false,
        options: optionsFrom([
          "イマニティ / メタトロン / レベル1",
          "フリューゲル / ラファエル / レベル5",
          "ファンタズマ / ガブリエル / レベル6"
        ]),
        correct: ["2"],
        explanation: "TeXサンプルの第5問に対応する解答欄です。"
      },
      {
        id: "anime-q6",
        label: "6",
        section: "第6問",
        prompt: "A と B、C と D の関係として最も適当な組合せを選べ。",
        pageId: "anime-p6",
        points: 10,
        multi: false,
        options: optionsFrom(["< / <", "< / =", "= / >", "> / >"]),
        correct: ["1"],
        explanation: "TeXサンプルの第6問に対応する解答欄です。"
      },
      {
        id: "anime-q7",
        label: "7",
        section: "第7問",
        prompt: "口コミの内容に該当するアニメとして最も適当なものを選べ。",
        pageId: "anime-p7",
        points: 10,
        multi: false,
        options: optionsFrom(["化物語", "虚構推理", "呪術廻戦", "モブサイコ100"]),
        correct: ["1"],
        explanation: "TeXサンプルの第7問に対応する解答欄です。"
      },
      {
        id: "anime-q8",
        label: "8",
        section: "第8問",
        prompt: "英語の説明が意味する単語の組合せとして最も適当なものを選べ。",
        pageId: "anime-p8",
        points: 12,
        multi: false,
        options: optionsFrom(["isekai / manga", "romcom / lightnovel", "yuri / doujinshi", "catgirl / comiket"]),
        correct: ["3"],
        explanation: "TeXサンプルの第8問に対応する解答欄です。"
      },
      {
        id: "anime-q9",
        label: "9",
        section: "第9問",
        prompt: "空欄に当てはまる単語として最も適当なものを選べ。",
        pageId: "anime-p9",
        points: 10,
        multi: false,
        options: optionsFrom(["scoff", "despise", "inferior", "underestimate"]),
        correct: ["4"],
        explanation: "TeXサンプルの第9問に対応する解答欄です。"
      }
    ]
  }
];
