import { mathToHtml } from "../math";
import { parseAuthoringAttributes, parseMarkCommand } from "./authoringSyntax";

interface ParsedMark {
  id: string;
  label: string;
  answer: string[];
  points: number;
  choices: number;
  multi: boolean;
}

interface ParsedAuthoringDocument {
  title: string;
  marks: ParsedMark[];
  renderedHtml: string;
  jsonPreview: string;
  errors: string[];
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
      const attrs = parseAuthoringAttributes(attrsRaw);
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
    const label = markMatch[2];
    const parsed = parseMarkCommand(markMatch[1], label);
    errors.push(...parsed.errors);

    marks.push({
      id: `draft-${markIndex}`,
      label: parsed.label,
      answer: parsed.answer,
      points: parsed.points,
      choices: parsed.choices,
      multi: parsed.multi
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
