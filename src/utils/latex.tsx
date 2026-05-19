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

      const graphicsLine = line.match(/^\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}$/);
      if (graphicsLine) {
        const src = escapeHtml(graphicsLine[1]);
        return `<figure><img src="${src}" alt="uploaded figure" /><figcaption>${src}</figcaption></figure>`;
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
以下の連立方程式において，各式 1 から 3 がそれぞれ画像 I から III に示されたアニメの名称の一部を表している。
\mark[answer=4,points=10,choices=4]{1}

\sectiontitle{第2問}
暗殺教室に関する次の問いに答えよ。
\subsectiontitle{問1}
\mark[answer=2,points=2,choices=4]{2}
\subsectiontitle{問2}
\mark[answer=4,points=2,choices=9]{3}
\mark[answer=7,points=2,choices=9]{4}
\mark[answer=2,points=3,choices=9]{5}
\mark[answer=8,points=3,choices=9]{6}

\sectiontitle{第3問}
図中の X に入る最も適当な記号を選べ。
\mark[answer=3,points=10,choices=5]{7}

\sectiontitle{第4問}
集合と分類に関する次の問いに答えよ。
\subsectiontitle{問1}
\mark[answer=4,points=4,choices=8]{8}
\subsectiontitle{問2}
\mark[answer=4,points=4,choices=4]{9}
\mark[answer=1,points=4,choices=4]{10}
\mark[answer=1,points=4,choices=4]{11}

\sectiontitle{第5問}
漢字表記の読みとして最も適当なものを選べ。
\mark[answer=2,points=4,choices=3]{12}
\mark[answer=1,points=3,choices=3]{13}
\mark[answer=2,points=3,choices=3]{14}

\sectiontitle{第6問}
不等式の関係として最も適当な記号を選べ。
\mark[answer=3,points=5,choices=3]{15}
\mark[answer=1,points=5,choices=3]{16}

\sectiontitle{第7問}
口コミの内容に該当するアニメとして最も適当なものを選べ。
\mark[answer=1,points=10,choices=4]{17}

\sectiontitle{第8問}
英英辞典の説明が意味する語として最も適当なものを選べ。
\mark[answer=3,points=6,choices=4]{18}
\mark[answer=4,points=6,choices=4]{19}

\sectiontitle{第9問}
英文の空欄に当てはまる単語として最も適当なものを選べ。
\mark[answer=4,points=10,choices=4]{20}
`;
