import type { QuestionSlot } from "../../../types";
import { correctAnimeAnswer } from "./answerKey";
import { animePageId } from "./markLayout";

const optionsFrom = (contents: string[]) =>
  contents.map((content, index) => {
    const value = String(index + 1);
    return { value, label: value, content };
  });

export const animeOnlymarkQuestions: QuestionSlot[] = [
  {
    id: "anime-q01",
    label: "1",
    section: "第1問",
    prompt: "式が表すアニメの名称として最も適当なものを選べ。",
    pageId: animePageId(1),
    points: 10,
    multi: false,
    options: optionsFrom(["オッドタクシー", "おねがい☆ティーチャー", "オーバーロード", "【推しの子】"]),
    correct: correctAnimeAnswer(1),
    explanation: "TeXサンプルの第1問に対応する解答欄です。"
  },
  {
    id: "anime-q02",
    label: "2",
    section: "第2問 問1",
    prompt: "学期末テストの最終問題として最も適当なものを選べ。",
    pageId: animePageId(2),
    points: 4,
    multi: false,
    options: optionsFrom(["ルベーグ積分", "食塩水", "体心立方格子", "放物線"]),
    correct: correctAnimeAnswer(2),
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
    correct: correctAnimeAnswer(3),
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
    correct: correctAnimeAnswer(4),
    explanation: "TeXサンプルの第2問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q05",
    label: "5",
    section: "第2問 問2",
    prompt: "寺坂竜馬に対応するコードネームを選べ。",
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
    correct: correctAnimeAnswer(5),
    explanation: "TeXサンプルの第2問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q06",
    label: "6",
    section: "第2問 問2",
    prompt: "吉田大成に対応するコードネームを選べ。",
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
    correct: correctAnimeAnswer(6),
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
    correct: correctAnimeAnswer(7),
    explanation: "TeXサンプルの第3問に対応する解答欄です。"
  },
  {
    id: "anime-q08",
    label: "8",
    section: "第4問 問1",
    prompt: "要素 I から III の分類として最も適当なものを選べ。",
    pageId: animePageId(6),
    points: 7,
    multi: false,
    options: optionsFrom(["AAA", "AAĀ", "AĀA", "AĀĀ", "ĀAA", "ĀAĀ", "ĀĀA", "ĀĀĀ"]),
    correct: correctAnimeAnswer(8),
    explanation: "TeXサンプルの第4問 問1に対応する解答欄です。"
  },
  {
    id: "anime-q09",
    label: "9",
    section: "第4問 問2",
    prompt: "椎名真昼の分類として最も適当なものを選べ。",
    pageId: animePageId(7),
    points: 3,
    multi: false,
    options: optionsFrom(["A∩B", "Ā∩B", "A∩B̄", "Ā∩B̄"]),
    correct: correctAnimeAnswer(9),
    explanation: "TeXサンプルの第4問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q10",
    label: "10",
    section: "第4問 問2",
    prompt: "西森柚咲の分類として最も適当なものを選べ。",
    pageId: animePageId(7),
    points: 3,
    multi: false,
    options: optionsFrom(["A∩B", "Ā∩B", "A∩B̄", "Ā∩B̄"]),
    correct: correctAnimeAnswer(10),
    explanation: "TeXサンプルの第4問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q11",
    label: "11",
    section: "第4問 問2",
    prompt: "楪いのりの分類として最も適当なものを選べ。",
    pageId: animePageId(7),
    points: 3,
    multi: false,
    options: optionsFrom(["A∩B", "Ā∩B", "A∩B̄", "Ā∩B̄"]),
    correct: correctAnimeAnswer(11),
    explanation: "TeXサンプルの第4問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q12",
    label: "12",
    section: "第5問",
    prompt: "「天翼種」の読みとして最も適当なものを選べ。",
    pageId: animePageId(8),
    points: 3,
    multi: false,
    options: optionsFrom(["イマニティ", "フリューゲル", "ファンタズマ"]),
    correct: correctAnimeAnswer(12),
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
    correct: correctAnimeAnswer(13),
    explanation: "TeXサンプルの第5問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q14",
    label: "14",
    section: "第5問",
    prompt: "「超能力者」の読みとして最も適当なものを選べ。",
    pageId: animePageId(8),
    points: 4,
    multi: false,
    options: optionsFrom(["レベル1", "レベル5", "レベル6"]),
    correct: correctAnimeAnswer(14),
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
    correct: correctAnimeAnswer(15),
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
    correct: correctAnimeAnswer(16),
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
    correct: correctAnimeAnswer(17),
    explanation: "TeXサンプルの第7問に対応する解答欄です。"
  },
  {
    id: "anime-q18",
    label: "18",
    section: "第8問",
    prompt: "問1の説明が意味する単語として最も適当なものを選べ。",
    pageId: animePageId(11),
    points: 4,
    multi: false,
    options: optionsFrom(["historical", "isekai", "post-apocalyptic", "supernatural"]),
    correct: correctAnimeAnswer(18),
    explanation: "TeXサンプルの第8問 問1に対応する解答欄です。"
  },
  {
    id: "anime-q19",
    label: "19",
    section: "第8問",
    prompt: "問2の説明が意味する単語として最も適当なものを選べ。",
    pageId: animePageId(11),
    points: 4,
    multi: false,
    options: optionsFrom(["catgirl", "romcom", "shojo", "yuri"]),
    correct: correctAnimeAnswer(19),
    explanation: "TeXサンプルの第8問 問2に対応する解答欄です。"
  },
  {
    id: "anime-q20",
    label: "20",
    section: "第8問",
    prompt: "問3の説明が意味する単語として最も適当なものを選べ。",
    pageId: animePageId(12),
    points: 4,
    multi: false,
    options: optionsFrom(["comiket", "doujinshi", "lightnovel", "manga"]),
    correct: correctAnimeAnswer(20),
    explanation: "TeXサンプルの第8問 問3に対応する解答欄です。"
  },
  {
    id: "anime-q21",
    label: "21",
    section: "第9問",
    prompt: "空欄に当てはまる単語として最も適当なものを選べ。",
    pageId: animePageId(13),
    points: 10,
    multi: false,
    options: optionsFrom(["despise", "overcome", "scoff", "underestimate"]),
    correct: correctAnimeAnswer(21),
    explanation: "TeXサンプルの第9問に対応する解答欄です。"
  }
];
