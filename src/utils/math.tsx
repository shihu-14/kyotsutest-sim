import type { ReactNode } from "react";
import katex from "katex";

function escapeMathHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    return escapeMathHtml(latex);
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

