import type { AuthoringMeta } from "../types";

export interface DraftMark {
  id: string;
  label: string;
  answer: string;
  points: number;
  choices: number;
  multi: boolean;
  optionContents: DraftChoice[];
}

export interface DraftChoice {
  value: string;
  content: string;
}

export interface DraftSubsection {
  id: string;
  title: string;
  body: string;
  marks: DraftMark[];
}

export interface DraftSection {
  id: string;
  title: string;
  body: string;
  marks: DraftMark[];
  subsections: DraftSubsection[];
}

export interface ExamDraft {
  sections: DraftSection[];
}

export interface DraftMarkEntry {
  mark: DraftMark;
  sectionTitle: string;
  sectionIndex: number;
  subsectionIndex: number | null;
  markIndex: number;
}

const markPattern = /\\mark(?:\[([^\]]*)\])?\{([^}]*)\}/g;
const choicePattern = /^\\choice\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}$/;

function positiveChoiceCount(count: number): number {
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
}

export function createDefaultChoices(count: number): DraftChoice[] {
  return Array.from({ length: positiveChoiceCount(count) }, (_item, index) => {
    const value = String(index + 1);
    return { value, content: value };
  });
}

export function normalizeMarkChoices(mark: DraftMark): DraftChoice[] {
  const existingByValue = new Map(mark.optionContents.map((choice) => [choice.value, choice]));
  return Array.from({ length: positiveChoiceCount(mark.choices) }, (_item, index) => {
    const value = String(index + 1);
    return existingByValue.get(value) ?? { value, content: value };
  });
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

function serializeMark(mark: DraftMark): string {
  const attrs = [
    `answer=${mark.answer}`,
    `points=${Math.max(0, mark.points)}`,
    `choices=${positiveChoiceCount(mark.choices)}`,
    mark.multi ? "multi=true" : ""
  ].filter(Boolean);

  return `\\mark[${attrs.join(",")}]{${mark.label}}`;
}

function serializeChoice(mark: DraftMark, choice: DraftChoice): string {
  return `\\choice{${mark.label}}{${choice.value}}{${choice.content}}`;
}

function bodyComment(label: string, hasBody: boolean): string {
  return hasBody ? `% === ${label} ===` : `% === ${label}: ここに問題文を記述 ===`;
}

function markComment(mark: DraftMark): string {
  const answer = mark.answer.trim() || "未設定";
  return `% --- 解答番号 ${mark.label}: 正解 ${answer} / 配点 ${Math.max(0, mark.points)} / 選択肢 ${positiveChoiceCount(mark.choices)} ---`;
}

function layoutCommentLines(): string[] {
  return [
    "% --- preview設定: 必要なら次の行を有効化して調整 ---",
    "% \\pagecolor{beige}",
    "% \\linespread{1.5}",
    "% \\geometry{inner=0.9in,outer=0.9in,top=50pt,bottom=0.76in}"
  ];
}

function createSection(index: number, title = `第${index + 1}問`): DraftSection {
  return {
    id: `section-${index + 1}`,
    title,
    body: "",
    marks: [],
    subsections: []
  };
}

function createSubsection(
  sectionIndex: number,
  subsectionIndex: number,
  title = `問${subsectionIndex + 1}`
): DraftSubsection {
  return {
    id: `section-${sectionIndex + 1}-subsection-${subsectionIndex + 1}`,
    title,
    body: "",
    marks: []
  };
}

function parseMark(attrsRaw: string | undefined, label: string, index: number): DraftMark {
  const attrs = parseAttributes(attrsRaw);
  const points = Number(attrs.points ?? 0);
  const choices = Number(attrs.choices ?? 4);
  const answer = attrs.answer ?? "";

  return {
    id: `mark-${index + 1}`,
    label,
    answer,
    points: Number.isFinite(points) ? points : 0,
    choices: Number.isInteger(choices) && choices > 0 ? choices : 4,
    multi: attrs.multi === "true" || answer.includes("|"),
    optionContents: createDefaultChoices(Number.isInteger(choices) && choices > 0 ? choices : 4)
  };
}

function appendBody(target: DraftSection | DraftSubsection, line: string): void {
  target.body = target.body ? `${target.body}\n${line}` : line;
}

function isPreviewLayoutLine(line: string): boolean {
  return /^\\(?:pagecolor|linespread|geometry|newgeometry|definecolor)\b/.test(line);
}

function isIgnoredPreambleLine(line: string): boolean {
  return /^\\(?:usepackage|usetikzlibrary|graphicspath|captionsetup|pagestyle|fancyhf|fancyfoot|fancypagestyle|renewcommand|newcommand|def|setcounter|newcounter|setmainfont|setmainjfont|setsansjfont|setul|linespread|pagecolor|definecolor|geometry|newgeometry)\b/.test(
    line
  );
}

export function parseAuthoringDraft(source: string): ExamDraft {
  const sections: DraftSection[] = [];
  let currentSection: DraftSection | null = null;
  let currentSubsection: DraftSubsection | null = null;
  const globalLayoutLines: string[] = [];
  let inCommentBlock = false;
  let markIndex = 0;

  const applyGlobalLayout = (section: DraftSection) => {
    if (!globalLayoutLines.length) {
      return;
    }
    globalLayoutLines.forEach((line) => appendBody(section, line));
  };

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = createSection(sections.length);
      sections.push(currentSection);
      applyGlobalLayout(currentSection);
    }

    return currentSection;
  };

  source.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (line.startsWith("\\begin{comment}")) {
      inCommentBlock = true;
      return;
    }
    if (line.startsWith("\\end{comment}")) {
      inCommentBlock = false;
      return;
    }
    if (
      inCommentBlock ||
      !line ||
      line.startsWith("%") ||
      line.startsWith("\\documentclass") ||
      line.startsWith("\\begin{document}") ||
      line.startsWith("\\end{document}")
    ) {
      return;
    }

    if (!currentSection && isPreviewLayoutLine(line)) {
      globalLayoutLines.push(line);
      return;
    }

    if (!currentSection && isIgnoredPreambleLine(line)) {
      return;
    }

    const titleMatch = line.match(/^\\sectiontitle\{([^}]*)\}$/);
    if (titleMatch) {
      currentSection = createSection(sections.length, titleMatch[1]);
      sections.push(currentSection);
      applyGlobalLayout(currentSection);
      currentSubsection = null;
      return;
    }

    if (line.startsWith("\\nextmondai")) {
      currentSection = createSection(sections.length);
      sections.push(currentSection);
      applyGlobalLayout(currentSection);
      currentSubsection = null;
      return;
    }

    const subsectionMatch = line.match(/^\\subsectiontitle\{([^}]*)\}$/);
    if (subsectionMatch) {
      const section = ensureSection();
      currentSubsection = createSubsection(sections.length - 1, section.subsections.length, subsectionMatch[1]);
      section.subsections.push(currentSubsection);
      return;
    }

    const choiceMatch = line.match(choicePattern);
    if (choiceMatch) {
      const [_full, markLabel, value, content] = choiceMatch;
      const section = ensureSection();
      const marks = currentSubsection ? currentSubsection.marks : section.marks;
      const target = marks.find((mark) => mark.label === markLabel) ?? marks.at(-1);
      if (target) {
        const nextContents = target.optionContents.filter((choice) => choice.value !== value);
        nextContents.push({ value, content });
        nextContents.sort((left, right) => Number(left.value) - Number(right.value));
        target.optionContents = nextContents;
        target.choices = Math.max(target.choices, Number(value) || 1);
      }
      return;
    }

    let hasMark = false;
    line.replace(markPattern, (_full, attrsRaw: string | undefined, label: string) => {
      const section = ensureSection();
      const mark = parseMark(attrsRaw, label, markIndex);
      markIndex += 1;
      if (currentSubsection) {
        currentSubsection.marks.push(mark);
      } else {
        section.marks.push(mark);
      }
      hasMark = true;
      return "";
    });

    if (hasMark) {
      return;
    }

    if (line.startsWith("\\examtitle")) {
      return;
    }

    appendBody(currentSubsection ?? ensureSection(), line);
  });

  return { sections };
}

export function serializeAuthoringDraft(meta: AuthoringMeta, draft: ExamDraft): string {
  const lines = [`\\examtitle{${meta.title}}`];

  draft.sections.forEach((section) => {
    lines.push("", `\\sectiontitle{${section.title}}`);
    lines.push(bodyComment(`大問本文: ${section.title}`, Boolean(section.body.trim())));
    lines.push(...layoutCommentLines());
    if (section.body.trim()) {
      lines.push(...section.body.trim().split("\n"));
    }
    section.marks.forEach((mark) => {
      lines.push(markComment(mark));
      lines.push(serializeMark(mark));
      normalizeMarkChoices(mark).forEach((choice) => lines.push(serializeChoice(mark, choice)));
    });
    section.subsections.forEach((subsection) => {
      lines.push("", `\\subsectiontitle{${subsection.title}}`);
      lines.push(
        bodyComment(`小問本文: ${section.title} ${subsection.title}`, Boolean(subsection.body.trim()))
      );
      if (subsection.body.trim()) {
        lines.push(...subsection.body.trim().split("\n"));
      }
      subsection.marks.forEach((mark) => {
        lines.push(markComment(mark));
        lines.push(serializeMark(mark));
        normalizeMarkChoices(mark).forEach((choice) => lines.push(serializeChoice(mark, choice)));
      });
    });
  });

  return `${lines.join("\n").trim()}\n`;
}

export function getDraftMarkEntries(draft: ExamDraft): DraftMarkEntry[] {
  return draft.sections.flatMap((section, sectionIndex) => [
    ...section.marks.map((mark, markIndex) => ({
      mark,
      sectionTitle: section.title,
      sectionIndex,
      subsectionIndex: null,
      markIndex
    })),
    ...section.subsections.flatMap((subsection, subsectionIndex) =>
      subsection.marks.map((mark, markIndex) => ({
        mark,
        sectionTitle: `${section.title} ${subsection.title}`,
        sectionIndex,
        subsectionIndex,
        markIndex
      }))
    )
  ]);
}

export function countDraftMarks(draft: ExamDraft): number {
  return getDraftMarkEntries(draft).length;
}

export function sumDraftPoints(draft: ExamDraft): number {
  return getDraftMarkEntries(draft).reduce((sum, entry) => sum + entry.mark.points, 0);
}
