import type { AuthoringMeta } from "../types";

export interface DraftMark {
  id: string;
  label: string;
  answer: string;
  points: number;
  choices: number;
  multi: boolean;
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
    `choices=${Math.max(1, mark.choices)}`,
    mark.multi ? "multi=true" : ""
  ].filter(Boolean);

  return `\\mark[${attrs.join(",")}]{${mark.label}}`;
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
    multi: attrs.multi === "true" || answer.includes("|")
  };
}

function appendBody(target: DraftSection | DraftSubsection, line: string): void {
  target.body = target.body ? `${target.body}\n${line}` : line;
}

export function parseAuthoringDraft(source: string): ExamDraft {
  const sections: DraftSection[] = [];
  let currentSection: DraftSection | null = null;
  let currentSubsection: DraftSubsection | null = null;
  let markIndex = 0;

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = createSection(sections.length);
      sections.push(currentSection);
    }

    return currentSection;
  };

  source.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith("%") ||
      line.startsWith("\\documentclass") ||
      line.startsWith("\\begin{document}") ||
      line.startsWith("\\end{document}")
    ) {
      return;
    }

    const titleMatch = line.match(/^\\sectiontitle\{([^}]*)\}$/);
    if (titleMatch) {
      currentSection = createSection(sections.length, titleMatch[1]);
      sections.push(currentSection);
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
    if (section.body.trim()) {
      lines.push(...section.body.trim().split("\n"));
    }
    section.marks.forEach((mark) => lines.push(serializeMark(mark)));
    section.subsections.forEach((subsection) => {
      lines.push("", `\\subsectiontitle{${subsection.title}}`);
      if (subsection.body.trim()) {
        lines.push(...subsection.body.trim().split("\n"));
      }
      subsection.marks.forEach((mark) => lines.push(serializeMark(mark)));
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
