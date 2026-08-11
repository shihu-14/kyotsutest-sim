import type { AuthoringMeta } from "../types";
import {
  authoringBodyComment,
  authoringLayoutCommentLines,
  authoringMarkComment,
  parseMarkCommand,
  positiveChoiceCount,
  serializeChoiceCommand,
  serializeMarkCommand
} from "./authoringSyntax";

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

export function createDefaultChoices(count: number): DraftChoice[] {
  return Array.from({ length: positiveChoiceCount(count) }, (_item, index) => {
    const value = String(index + 1);
    return { value, content: value };
  });
}

export function createDraftMark(label: string, points = 1): DraftMark {
  return {
    id: `mark-${label}`,
    label,
    answer: "1",
    points,
    choices: 4,
    multi: false,
    optionContents: createDefaultChoices(4)
  };
}

export function createDraftSection(index: number): DraftSection {
  return {
    id: `section-${index + 1}`,
    title: `第${index + 1}問`,
    body: "",
    marks: [],
    subsections: []
  };
}

export function createDraftSubsection(sectionIndex: number, subsectionIndex: number): DraftSubsection {
  return {
    id: `section-${sectionIndex + 1}-subsection-${subsectionIndex + 1}`,
    title: `問${subsectionIndex + 1}`,
    body: "",
    marks: []
  };
}

export function cloneDraft(draft: ExamDraft): ExamDraft {
  return {
    sections: draft.sections.map((section) => ({
      ...section,
      marks: section.marks.map((mark) => ({
        ...mark,
        optionContents: mark.optionContents.map((choice) => ({ ...choice }))
      })),
      subsections: section.subsections.map((subsection) => ({
        ...subsection,
        marks: subsection.marks.map((mark) => ({
          ...mark,
          optionContents: mark.optionContents.map((choice) => ({ ...choice }))
        }))
      }))
    }))
  };
}

export function normalizeMarkChoices(mark: DraftMark): DraftChoice[] {
  const existingByValue = new Map(mark.optionContents.map((choice) => [choice.value, choice]));
  return Array.from({ length: positiveChoiceCount(mark.choices) }, (_item, index) => {
    const value = String(index + 1);
    return existingByValue.get(value) ?? { value, content: value };
  });
}

export function normalizeFormDraft(draft: ExamDraft): ExamDraft {
  let nextMarkNumber = 1;

  return {
    sections: draft.sections.map((section, sectionIndex) => ({
      ...section,
      title: `第${sectionIndex + 1}問`,
      marks: section.marks.map((mark) => ({
        ...mark,
        label: String(nextMarkNumber++)
      })),
      subsections: section.subsections.map((subsection, subsectionIndex) => ({
        ...subsection,
        title: subsection.title.trim() || `問${subsectionIndex + 1}`,
        marks: subsection.marks.map((mark) => ({
          ...mark,
          label: String(nextMarkNumber++)
        }))
      }))
    }))
  };
}

export function normalizeSourceDraft(draft: ExamDraft): ExamDraft {
  return {
    sections: draft.sections.map((section, sectionIndex) => ({
      ...section,
      title: section.title.trim() || `第${sectionIndex + 1}問`,
      marks: section.marks.map((mark, markIndex) => ({
        ...mark,
        label: mark.label.trim() || String(markIndex + 1)
      })),
      subsections: section.subsections.map((subsection, subsectionIndex) => ({
        ...subsection,
        title: subsection.title.trim() || `問${subsectionIndex + 1}`,
        marks: subsection.marks.map((mark, markIndex) => ({
          ...mark,
          label: mark.label.trim() || String(markIndex + 1)
        }))
      }))
    }))
  };
}

export function shouldOmitSubsectionTitle(section: DraftSection, subsection: DraftSubsection): boolean {
  return section.marks.length === 0 && section.subsections.length === 1 && subsection.title.trim() === "問1";
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
  const parsed = parseMarkCommand(attrsRaw, label);

  return {
    id: `mark-${index + 1}`,
    label: parsed.label,
    answer: parsed.answerSource,
    points: parsed.points,
    choices: parsed.choices,
    multi: parsed.multi,
    optionContents: createDefaultChoices(parsed.choices)
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
      line.startsWith("\\documentclass") ||
      line.startsWith("\\begin{document}") ||
      line.startsWith("\\end{document}")
    ) {
      return;
    }

    if (line.startsWith("%")) {
      if (line.startsWith("% === 小問本文:") && currentSection && !currentSubsection) {
        currentSubsection = createSubsection(sections.length - 1, currentSection.subsections.length, "問1");
        currentSection.subsections.push(currentSubsection);
      }
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
    lines.push(authoringBodyComment(`大問本文: ${section.title}`, Boolean(section.body.trim())));
    lines.push(...authoringLayoutCommentLines());
    if (section.body.trim()) {
      lines.push(...section.body.trim().split("\n"));
    }
    section.marks.forEach((mark) => {
      lines.push(authoringMarkComment(mark));
      lines.push(serializeMarkCommand(mark));
      normalizeMarkChoices(mark).forEach((choice) => lines.push(serializeChoiceCommand(mark, choice)));
    });
    section.subsections.forEach((subsection) => {
      const omitSubsectionTitle = shouldOmitSubsectionTitle(section, subsection);
      lines.push("");
      if (!omitSubsectionTitle) {
        lines.push(`\\subsectiontitle{${subsection.title}}`);
      }
      lines.push(
        authoringBodyComment(
          omitSubsectionTitle ? `小問本文: ${section.title}` : `小問本文: ${section.title} ${subsection.title}`,
          Boolean(subsection.body.trim())
        )
      );
      if (subsection.body.trim()) {
        lines.push(...subsection.body.trim().split("\n"));
      }
      subsection.marks.forEach((mark) => {
        lines.push(authoringMarkComment(mark));
        lines.push(serializeMarkCommand(mark));
        normalizeMarkChoices(mark).forEach((choice) => lines.push(serializeChoiceCommand(mark, choice)));
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
        sectionTitle: shouldOmitSubsectionTitle(section, subsection)
          ? section.title
          : `${section.title} ${subsection.title}`,
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

export function sectionPointTotal(section: DraftSection): number {
  return [...section.marks, ...section.subsections.flatMap((subsection) => subsection.marks)].reduce(
    (sum, mark) => sum + mark.points,
    0
  );
}

export function sectionMarkCount(section: DraftSection): number {
  return section.marks.length + section.subsections.reduce((sum, subsection) => sum + subsection.marks.length, 0);
}
