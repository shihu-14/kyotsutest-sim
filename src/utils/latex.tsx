import type { ReactNode } from "react";
import katex from "katex";
import type { AuthoringMeta } from "../types";

export interface ParsedMark {
  id: string;
  label: string;
  answer: string[];
  points: number;
  choices: number;
  multi: boolean;
}

export interface ParsedAuthoringDocument {
  title: string;
  marks: ParsedMark[];
  renderedHtml: string;
  jsonPreview: string;
  errors: string[];
}

function stripOuterMath(input: string): string {
  if (input.startsWith("$$") && input.endsWith("$$")) {
    return input.slice(2, -2);
  }
  if (input.startsWith("$") && input.endsWith("$")) {
    return input.slice(1, -1);
  }
  if (input.startsWith("\\(") && input.endsWith("\\)")) {
    return input.slice(2, -2);
  }
  if (input.startsWith("\\[") && input.endsWith("\\]")) {
    return input.slice(2, -2);
  }
  return input;
}

export function mathToHtml(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(stripOuterMath(latex), {
      displayMode,
      throwOnError: false,
      strict: "ignore"
    });
  } catch {
    return escapeHtml(latex);
  }
}

export function renderMathSegments(text: string): ReactNode[] {
  const segments: ReactNode[] = [];
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$]+\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const displayMode = token.startsWith("$$") || token.startsWith("\\[");
    segments.push(
      <span
        className={displayMode ? "math-display-inline" : "math-inline"}
        dangerouslySetInnerHTML={{ __html: mathToHtml(token, displayMode) }}
        key={`${match.index}-${token}`}
      />
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments;
}

export function normalizePreviewText(text: string): string {
  const circledDigits = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

  return text
    .replace(/\\haiten\{([^}]*)\}/g, "（配点 $1）")
    .replace(/\\counterbox(?:\[[^\]]*\])?/g, "□")
    .replace(/\\egg\{([^}]*)\}/g, (_full, value: string) => circledDigits[Number(value)] ?? value)
    .replace(/\\(?:textbf|textsf|text|large|small|Large)\{([^}]*)\}/g, "$1")
    .replace(/\\(?:noindent|raggedright|centering)\b/g, "")
    .replace(/\\(?:hspace|vspace)\*?\{[^}]*\}/g, "")
    .replace(/\\textasciitilde/g, "〜")
    .replace(/\\(?:quad|qquad|,|;|:|!)/g, " ")
    .replace(/~/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseAttributes(input: string | undefined): Record<string, string> {
  if (!input) {
    return {};
  }

  return input.split(",").reduce<Record<string, string>>((attrs, pair) => {
    const [rawKey, ...rawValue] = pair.split("=");
    const key = rawKey?.trim();
    if (!key) {
      return attrs;
    }

    attrs[key] = rawValue.join("=").trim();
    return attrs;
  }, {});
}

function isPreviewSettingCommand(line: string): boolean {
  return /^\\(?:pagecolor|linespread|geometry|newgeometry|definecolor|setmainfont|setmainjfont|setsansjfont)\b/.test(line);
}

function renderInlineLatexHtml(text: string): string {
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$]+\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  let output = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    output += escapeHtml(text.slice(lastIndex, match.index));
    const token = match[0];
    const displayMode = token.startsWith("$$") || token.startsWith("\\[");
    output += mathToHtml(token, displayMode);
    lastIndex = match.index + token.length;
  }

  output += escapeHtml(text.slice(lastIndex));
  return output;
}

function replaceMarkCommands(line: string): string {
  return line.replace(/\\mark(?:\[([^\]]*)\])?\{([^}]*)\}/g, (_full, attrsRaw: string, label: string) => {
    const attrs = parseAttributes(attrsRaw);
    const points = Number(attrs.points ?? 0);
    const answer = attrs.answer ? attrs.answer.split("|").join(", ") : "未設定";
    return `<span class="latex-mark" title="answer: ${escapeHtml(answer)}, points: ${Number.isFinite(points) ? points : 0}">${escapeHtml(label)}</span>`;
  });
}

function replaceChoiceCommands(line: string): string {
  return line.replace(
    /\\choice\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
    (_full, markLabel: string, value: string, content: string) =>
      `<span class="latex-choice"><span>${escapeHtml(markLabel)}</span><strong>${escapeHtml(value)}</strong>${renderInlineLatexHtml(content)}</span>`
  );
}

function renderCommandAwareInlineHtml(line: string): string {
  const fragments: string[] = [];
  const placeholderPrefix = "__KYOTSU_HTML_FRAGMENT_";
  const stash = (html: string): string => {
    const token = `${placeholderPrefix}${fragments.length}__`;
    fragments.push(html);
    return token;
  };

  const withPlaceholders = line
    .replace(/\\mark(?:\[([^\]]*)\])?\{([^}]*)\}/g, (_full, attrsRaw: string, label: string) => {
      const attrs = parseAttributes(attrsRaw);
      const points = Number(attrs.points ?? 0);
      const answer = attrs.answer ? attrs.answer.split("|").join(", ") : "未設定";
      return stash(
        `<span class="latex-mark" title="answer: ${escapeHtml(answer)}, points: ${
          Number.isFinite(points) ? points : 0
        }">${escapeHtml(label)}</span>`
      );
    })
    .replace(
      /\\choice\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
      (_full, markLabel: string, value: string, content: string) =>
        stash(
          `<span class="latex-choice"><span>${escapeHtml(markLabel)}</span><strong>${escapeHtml(
            value
          )}</strong>${renderInlineLatexHtml(content)}</span>`
        )
    );

  let rendered = renderInlineLatexHtml(withPlaceholders);
  fragments.forEach((fragment, index) => {
    rendered = rendered.replaceAll(`${placeholderPrefix}${index}__`, fragment);
  });
  return rendered;
}

export function parseAuthoringLatex(source: string): ParsedAuthoringDocument {
  const titleMatch = source.match(/\\examtitle\{([^}]*)\}/);
  const title = titleMatch?.[1] ?? "無題の試験";
  const errors: string[] = [];
  const marks: ParsedMark[] = [];
  const markPattern = /\\mark(?:\[([^\]]*)\])?\{([^}]*)\}/g;
  let markMatch: RegExpExecArray | null;
  let markIndex = 1;

  while ((markMatch = markPattern.exec(source)) !== null) {
    const attrs = parseAttributes(markMatch[1]);
    const points = Number(attrs.points ?? 0);
    const choices = Number(attrs.choices ?? 4);
    const label = markMatch[2];
    const answer = attrs.answer ? attrs.answer.split("|").filter(Boolean) : [];
    const multi = attrs.multi === "true" || answer.length > 1;

    if (!attrs.answer) {
      errors.push(`${label}: 正解値 answer が未設定です。`);
    }
    if (!Number.isFinite(points) || points <= 0) {
      errors.push(`${label}: 配点 points は正の数で指定してください。`);
    }
    if (!Number.isInteger(choices) || choices <= 0) {
      errors.push(`${label}: choices は正の整数で指定してください。`);
    }

    marks.push({
      id: `draft-${markIndex}`,
      label,
      answer,
      points: Number.isFinite(points) ? points : 0,
      choices: Number.isInteger(choices) && choices > 0 ? choices : 4,
      multi
    });
    markIndex += 1;
  }

  const renderedLines = source
    .split("\n")
    .map((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        return "";
      }

      if (line.startsWith("%")) {
        return "";
      }

      const titleLine = line.match(/^\\examtitle\{([^}]*)\}$/);
      if (titleLine) {
        return `<h1>${escapeHtml(titleLine[1])}</h1>`;
      }

      const sectionLine = line.match(/^\\sectiontitle\{([^}]*)\}$/);
      if (sectionLine) {
        return `<h2>${escapeHtml(sectionLine[1])}</h2>`;
      }

      const subsectionLine = line.match(/^\\subsectiontitle\{([^}]*)\}$/);
      if (subsectionLine) {
        return `<h3>${escapeHtml(subsectionLine[1])}</h3>`;
      }

      if (isPreviewSettingCommand(line)) {
        return "";
      }

      const graphicsLine = line.match(/^\\includegraphics(?:\[([^\]]*)\])?\{([^}]*)\}$/);
      if (graphicsLine) {
        const options = graphicsLine[1] ? ` (${escapeHtml(graphicsLine[1])})` : "";
        const src = escapeHtml(graphicsLine[2]);
        return `<figure><img src="${src}" alt="uploaded figure" /><figcaption>${src}${options}</figcaption></figure>`;
      }

      if (line.includes("\\begin{tikzpicture}") || line.includes("\\end{tikzpicture}")) {
        return `<figure class="tikz-source"><figcaption>TikZ source</figcaption><pre>${escapeHtml(line)}</pre></figure>`;
      }

      return `<p>${renderCommandAwareInlineHtml(line)}</p>`;
    })
    .filter(Boolean)
    .join("");

  const jsonPreview = JSON.stringify(
    {
      title,
      marks,
      totalPoints: marks.reduce((sum, mark) => sum + mark.points, 0)
    },
    null,
    2
  );

  return {
    title,
    marks,
    renderedHtml: renderedLines,
    jsonPreview,
    errors
  };
}

export const defaultAuthoringMeta: AuthoringMeta = {
  title: "漫画映画",
  subject: "漫画映画",
  description: "漫画・映画に関する題材を共通テスト形式で解くサンプル問題冊子。",
  questionCount: 20,
  totalPoints: 100,
  durationMinutes: 40
};

export const defaultAuthoringSource = String.raw`\examtitle{漫画映画}
\sectiontitle{第1問}
以下の連立方程式において, 各式 ① から ③ がそれぞれ画像 I から III に示されたアニメの名称の一部を表している。
このとき, 式 \(n_d\:g'' atf-\) が表すアニメの名称として最も適当なものを選べ。
$$\left\{\begin{aligned} y-x_n&=ci \\ fg''&=c \\ pb\times abq^\circ&={}_d t \end{aligned}\right.$$
% 元TeX画像: hibike.png, sidonia2.png, hurumetaru.png
\mark[answer=4,points=10,choices=4]{1}
\choice{1}{1}{おねがい☆ティーチャー}
\choice{1}{2}{オーバーロード}
\choice{1}{3}{オッドタクシー}
\choice{1}{4}{【推しの子】}

\sectiontitle{第2問}
暗殺教室に関する次の問いに答えよ。
\subsectiontitle{問1}
第2期第十二話において, 赤羽業と浅野学秀が学期末テストで対決した。
その勝敗を分けることとなったこの試験の最終問題として最も適当なものを選べ。
\mark[answer=2,points=2,choices=4]{2}
\choice{2}{1}{実数上の非負値可測関数に関する極限等式の証明}
\choice{2}{2}{食塩水の濃度計算}
\choice{2}{3}{体心立方格子構造の領域体積}
\choice{2}{4}{放物線と面積二等分線}
\subsectiontitle{問2}
第2期第四話において登場人物同士がコードネームで呼び合う場面について, A から D に示す登場人物の本名に対応するコードネームを選べ。
% 元TeX画像: ansatu_codename2_gray.pdf
\mark[answer=4,points=2,choices=9]{3}
\choice{3}{1}{野球バカ}
\choice{3}{2}{鷹岡もどき}
\choice{3}{3}{コロコロ上がり}
\choice{3}{4}{中二半}
\choice{3}{5}{すごいサル}
\choice{3}{6}{女たらしクソ野郎}
\choice{3}{7}{性別}
\choice{3}{8}{ホームベース}
\choice{3}{9}{変態終末期}
\mark[answer=7,points=2,choices=9]{4}
\choice{4}{1}{野球バカ}
\choice{4}{2}{鷹岡もどき}
\choice{4}{3}{コロコロ上がり}
\choice{4}{4}{中二半}
\choice{4}{5}{すごいサル}
\choice{4}{6}{女たらしクソ野郎}
\choice{4}{7}{性別}
\choice{4}{8}{ホームベース}
\choice{4}{9}{変態終末期}
\mark[answer=2,points=3,choices=9]{5}
\choice{5}{1}{野球バカ}
\choice{5}{2}{鷹岡もどき}
\choice{5}{3}{コロコロ上がり}
\choice{5}{4}{中二半}
\choice{5}{5}{すごいサル}
\choice{5}{6}{女たらしクソ野郎}
\choice{5}{7}{性別}
\choice{5}{8}{ホームベース}
\choice{5}{9}{変態終末期}
\mark[answer=8,points=3,choices=9]{6}
\choice{6}{1}{野球バカ}
\choice{6}{2}{鷹岡もどき}
\choice{6}{3}{コロコロ上がり}
\choice{6}{4}{中二半}
\choice{6}{5}{すごいサル}
\choice{6}{6}{女たらしクソ野郎}
\choice{6}{7}{性別}
\choice{6}{8}{ホームベース}
\choice{6}{9}{変態終末期}

\sectiontitle{第3問}
以下のグラフおよび図は, あるアニメに関するものである。
これらの内容に基づいて \(X\) に入る最も適当な記号を選べ。
% 元TeX図: データ系列グラフと年表を tikzpicture で描画
\mark[answer=3,points=10,choices=5]{7}
\choice{7}{1}{\(\Omega\)}
\choice{7}{2}{\(\alpha\)}
\choice{7}{3}{\(\beta\)}
\choice{7}{4}{\(\gamma\)}
\choice{7}{5}{\(\delta\)}

\sectiontitle{第4問}
集合に関する以下の問いに答えよ。
\subsectiontitle{問1}
ベン図が与えられたとき, 要素 I から III の分類として最も適当なものを選べ。
I: 綾小路清隆, II: 竈門禰豆子, III: 御坂美琴。
% 元TeX図: 集合 A のベン図を tikzpicture で描画
\mark[answer=4,points=4,choices=8]{8}
\choice{8}{1}{AAA}
\choice{8}{2}{AAĀ}
\choice{8}{3}{AĀA}
\choice{8}{4}{AĀĀ}
\choice{8}{5}{ĀAA}
\choice{8}{6}{ĀAĀ}
\choice{8}{7}{ĀĀA}
\choice{8}{8}{ĀĀĀ}
\subsectiontitle{問2}
ベン図が与えられたとき, 要素 I から III の分類として最も適当なものを選べ。
I: 椎名真昼, II: 西森柚咲, III: 楪いのり。
% 元TeX図: 集合 A, B のベン図を tikzpicture で描画
\mark[answer=4,points=4,choices=4]{9}
\choice{9}{1}{A∩B}
\choice{9}{2}{Ā∩B}
\choice{9}{3}{A∩B̄}
\choice{9}{4}{Ā∩B̄}
\mark[answer=1,points=4,choices=4]{10}
\choice{10}{1}{A∩B}
\choice{10}{2}{Ā∩B}
\choice{10}{3}{A∩B̄}
\choice{10}{4}{Ā∩B̄}
\mark[answer=1,points=4,choices=4]{11}
\choice{11}{1}{A∩B}
\choice{11}{2}{Ā∩B}
\choice{11}{3}{A∩B̄}
\choice{11}{4}{Ā∩B̄}

\sectiontitle{第5問}
以下の問1から問3の下線部の漢字に相当する読みとして最も適当なものを選べ。
問1: 『水素爆弾』の直撃にも堪えた序列第六位「天翼種」。
\mark[answer=2,points=4,choices=3]{12}
\choice{12}{1}{イマニティ}
\choice{12}{2}{フリューゲル}
\choice{12}{3}{ファンタズマ}
問2: 「智慧之王」の声に従い暴食之王を起動。
\mark[answer=1,points=3,choices=3]{13}
\choice{13}{1}{ラファエル}
\choice{13}{2}{メタトロン}
\choice{13}{3}{ガブリエル}
問3: 「超能力者」用の付帯施設は学校敷地内にまとまっているとは限らない。
\mark[answer=2,points=3,choices=3]{14}
\choice{14}{1}{レベル1}
\choice{14}{2}{レベル5}
\choice{14}{3}{レベル6}

\sectiontitle{第6問}
画像 I から VI について関係式「I < II = III < IV < V << VI」が成り立っているとき, A と B, C と D に当てはまる記号として最も適当なものを選べ。
% 元TeX画像: akusera.png, yotuba3.png, sinomiya.png, nanakusa.png, yanami.png, titanda.png, gozyou2.png, igarashi.png, issiki3.png, itinose.png
\mark[answer=3,points=5,choices=3]{15}
\choice{15}{1}{<}
\choice{15}{2}{=}
\choice{15}{3}{>}
\mark[answer=1,points=5,choices=3]{16}
\choice{16}{1}{<}
\choice{16}{2}{=}
\choice{16}{3}{>}

\sectiontitle{第7問}
以下の文章は, あるアニメに関する口コミである。この内容に該当するアニメとして最も適当なものを選べ。
長ゼリフや会話劇, 妖怪のような存在に苦しめられる少女達, 独特な作画や演出に言及した複数の口コミが示されている。
% 元TeX画像: unknown-icon.png, five-stars.png, three-stars.png, one-stars.png
\mark[answer=1,points=10,choices=4]{17}
\choice{17}{1}{化物語}
\choice{17}{2}{虚構推理}
\choice{17}{3}{呪術廻戦}
\choice{17}{4}{モブサイコ100}

\sectiontitle{第8問}
以下の英文は, 英語版 Wikipedia にも掲載されているアニメに関する単語の説明である。
問1, 問2の説明が意味する単語を選べ。
問1: romantic or deeply emotional relationships between female characters.
\mark[answer=3,points=6,choices=4]{18}
\choice{18}{1}{isekai}
\choice{18}{2}{romcom}
\choice{18}{3}{yuri}
\choice{18}{4}{catgirl}
問2: self-published work, often in manga or novel format, created by independent artists or groups.
\mark[answer=4,points=6,choices=4]{19}
\choice{19}{1}{manga}
\choice{19}{2}{lightnovel}
\choice{19}{3}{comiket}
\choice{19}{4}{doujinshi}

\sectiontitle{第9問}
以下は「ノーゲーム・ノーライフ」に登場するあるゲームが行われている場面を描いたものである。
空欄に当てはまる単語として最も適当なものを選べ。
Sora and dreadless Siro overwhelmed driven native executing gods since enemies ___ feeblish humanity.
\mark[answer=4,points=10,choices=4]{20}
\choice{20}{1}{scoff}
\choice{20}{2}{despise}
\choice{20}{3}{inferior}
\choice{20}{4}{underestimate}
`;
