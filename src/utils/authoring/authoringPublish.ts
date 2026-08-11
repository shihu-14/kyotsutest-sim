import type {
  AuthoringMeta,
  Exam,
  ExamPage,
  ProblemBlock,
  QuestionSlot
} from "../../types";
import {
  createDraftSection,
  createDraftSubsection,
  getDraftMarkEntries,
  normalizeMarkChoices,
  normalizeSourceDraft,
  parseAuthoringDraft,
  serializeAuthoringDraft,
  shouldOmitSubsectionTitle,
  type DraftMark,
  type DraftSection,
  type ExamDraft
} from "./authoringDraft";
import { defaultAuthoringMeta, defaultAuthoringSource } from "../../data/authoringDefaults";
import { coverInstructionsFromSource, metaFromExam } from "./authoringEnvironment";
import { parseAuthoringLatex } from "./authoringPreview";
import { loadAuthorSource } from "./authoringStorage";
import {
  authoringBodyComment,
  authoringLayoutCommentLines,
  authoringMarkComment,
  serializeChoiceCommand,
  serializeMarkCommand
} from "./authoringSyntax";

const draftPageId = (sectionIndex: number) => `draft-p${sectionIndex + 1}`;
const authoringTexPreamble = String.raw`\documentclass[b5paper,12pt]{article}
\usepackage{amsmath,amssymb,graphicx,tikz,xcolor}
\newcounter{kyotsuanswer}
\newcommand{\examtitle}[1]{\def\KyotsuExamTitle{#1}}
\newcommand{\sectiontitle}[1]{\section*{#1}}
\newcommand{\subsectiontitle}[1]{\subsection*{#1}}
\newcommand{\counterbox}{\stepcounter{kyotsuanswer}\fbox{\arabic{kyotsuanswer}}}
\newcommand{\choice}[3]{\par\smallskip\noindent\textcircled{\scriptsize #2}\quad #3}
\newcommand{\mark}[2][]{\counterbox}`;
const animeSampleExamId = "anime-onlymark-2026";

function splitTexOptions(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  input.split("").forEach((char) => {
    if (char === "{") {
      depth += 1;
    }
    if (char === "}") {
      depth = Math.max(0, depth - 1);
    }
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      return;
    }
    current += char;
  });

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function texOptionsToMap(input: string): Map<string, string> {
  return splitTexOptions(input).reduce((options, part) => {
    const [rawKey, ...rawValue] = part.split("=");
    const key = rawKey.trim();
    if (!key) {
      return options;
    }
    options.set(key, rawValue.length ? rawValue.join("=").trim() : "true");
    return options;
  }, new Map<string, string>());
}

function texLengthToCss(value: string): string | undefined {
  const compact = value.trim().replace(/\s+/g, "");
  if (!compact) {
    return undefined;
  }

  const textWidthMatch = compact.match(/^([0-9.]+)?\\(?:textwidth|linewidth|hsize|paperwidth)$/);
  if (textWidthMatch) {
    const ratio = Number(textWidthMatch[1] ?? 1);
    return `${Number.isFinite(ratio) ? ratio * 100 : 100}%`;
  }

  const lengthMatch = compact.match(/^([0-9.]+)(pt|px|em|rem|cm|mm|in|%)$/);
  if (lengthMatch) {
    return `${lengthMatch[1]}${lengthMatch[2]}`;
  }

  if (compact === "\\textwidth" || compact === "\\linewidth" || compact === "\\hsize" || compact === "\\paperwidth") {
    return "100%";
  }

  return undefined;
}

function cssColorFromTex(value: string, colors: Map<string, string>): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("#") || trimmed.startsWith("rgb") || trimmed.startsWith("hsl")) {
    return trimmed;
  }

  const rgb = trimmed.match(/^RGB\((\d+),(\d+),(\d+)\)$/);
  if (rgb) {
    return `rgb(${rgb[1]}, ${rgb[2]}, ${rgb[3]})`;
  }

  return colors.get(trimmed) ?? trimmed;
}

function texColorMap(body: string): Map<string, string> {
  const colors = new Map<string, string>([
    ["beige", "rgb(252, 252, 252)"],
    ["white", "#ffffff"],
    ["black", "#000000"]
  ]);

  body.split("\n").forEach((line) => {
    const match = line.trim().match(/^\\definecolor\{([^}]*)\}\{RGB\}\{([^}]*)\}$/);
    if (!match) {
      return;
    }
    const values = match[2].split(",").map((value) => Number(value.trim()));
    if (values.length === 3 && values.every((value) => Number.isFinite(value))) {
      colors.set(match[1], `rgb(${values[0]}, ${values[1]}, ${values[2]})`);
    }
  });

  return colors;
}

export function serializeSectionSource(section: DraftSection): string {
  const lines = [`\\sectiontitle{${section.title}}`];

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

  return `${lines.join("\n").trim()}\n`;
}

export function buildSectionCompileSource(meta: AuthoringMeta, section: DraftSection, environmentSource: string): string {
  return `${authoringTexPreamble}\n${environmentSource}\n\\begin{document}\n\\examtitle{${meta.title}}\n${serializeSectionSource(section)}\\end{document}\n`;
}

function draftBodyLineFromBlock(block: ProblemBlock): string | null {
  if (block.type === "paragraph") {
    return block.text;
  }

  if (block.type === "formula") {
    return `$$${block.latex}$$`;
  }

  if (block.type === "figure") {
    if (block.imageUrl) {
      return `\\includegraphics{${block.imageUrl}}`;
    }
    if (block.tikz) {
      return block.tikz;
    }
    return block.caption;
  }

  if (block.type === "note") {
    return `【注】${block.text}`;
  }

  return null;
}

function sectionKeyFromTitle(title: string): string {
  return title.match(/第[^\s]+問/)?.[0] ?? title.split(/\s+/)[0] ?? title;
}

function collectPageBodies(exam: Exam): Map<string, string> {
  const bodyBySection = new Map<string, string[]>();

  exam.pages.forEach((page) => {
    const sectionKey = sectionKeyFromTitle(page.title);
    const lines = bodyBySection.get(sectionKey) ?? [];
    page.blocks.forEach((block) => {
      const line = draftBodyLineFromBlock(block);
      if (line) {
        lines.push(line);
      }
    });
    if (lines.length) {
      bodyBySection.set(sectionKey, lines);
    }
  });

  return new Map(Array.from(bodyBySection.entries()).map(([sectionKey, lines]) => [sectionKey, lines.join("\n")]));
}

function draftFromExam(exam: Exam): ExamDraft {
  const sections: DraftSection[] = [];
  const bodyBySection = collectPageBodies(exam);

  exam.questions.forEach((question, index) => {
    const [sectionTitle, ...subsectionParts] = question.section.split(/\s+/);
    const subsectionTitle = subsectionParts.join(" ");
    let section = sections.find((candidate) => candidate.title === sectionTitle);
    if (!section) {
      section = createDraftSection(sections.length);
      section.title = sectionTitle || `第${sections.length + 1}問`;
      sections.push(section);
    }
    section.body = bodyBySection.get(section.title) ?? section.body;

    const mark: DraftMark = {
      id: `mark-${index + 1}`,
      label: question.label,
      answer: question.correct.join("|"),
      points: question.points,
      choices: question.options.length,
      multi: question.multi,
      optionContents: question.options.map((option) => ({ value: option.value, content: option.content }))
    };

    if (subsectionTitle) {
      let subsection = section.subsections.find((candidate) => candidate.title === subsectionTitle);
      if (!subsection) {
        subsection = createDraftSubsection(sections.length - 1, section.subsections.length);
        subsection.title = subsectionTitle;
        section.subsections.push(subsection);
      }
      subsection.marks.push(mark);
      return;
    }

    section.marks.push(mark);
  });

  return normalizeSourceDraft({ sections });
}

export function sourceFromExam(exam: Exam | null | undefined): string {
  if (!exam) {
    const annotatedDefaultSource = serializeAuthoringDraft(
      defaultAuthoringMeta,
      normalizeSourceDraft(parseAuthoringDraft(defaultAuthoringSource))
    );
    return loadAuthorSource(annotatedDefaultSource);
  }

  if (exam.id === animeSampleExamId) {
    return serializeAuthoringDraft(metaFromExam(exam), normalizeSourceDraft(parseAuthoringDraft(defaultAuthoringSource)));
  }

  return serializeAuthoringDraft(metaFromExam(exam), draftFromExam(exam));
}

export function validateAuthoring(source: string, meta: AuthoringMeta): string[] {
  const parsed = parseAuthoringLatex(source);
  const errors = [...parsed.errors];

  if (parsed.marks.length < meta.questionCount) {
    errors.push(`設定された問題数は${meta.questionCount}問ですが、問題文内のマークは${parsed.marks.length}個です。`);
  }

  if (parsed.marks.length > meta.questionCount) {
    errors.push(`問題文内のマークは${parsed.marks.length}個ですが、設定された問題数は${meta.questionCount}問です。`);
  }

  const parsedTotal = parsed.marks.reduce((sum, mark) => sum + mark.points, 0);
  if (parsed.marks.length > 0 && parsedTotal !== meta.totalPoints) {
    errors.push(`設定された配点は${meta.totalPoints}点ですが、マークの配点合計は${parsedTotal}点です。`);
  }

  return errors;
}

function createDefaultQuestion(index: number, totalPoints: number, questionCount: number): QuestionSlot {
  const basePoints = Math.floor(totalPoints / Math.max(1, questionCount));
  const remainder = totalPoints % Math.max(1, questionCount);
  const points = basePoints + (index < remainder ? 1 : 0);
  const label = String(index + 1);

  return {
    id: `draft-q${label.padStart(2, "0")}`,
    label,
    section: `第${index + 1}問`,
    prompt: "作成したTeXコードに対応する解答欄です。",
    pageId: draftPageId(index),
    points,
    multi: false,
    options: ["0", "1", "2", "3", "4"].map((value) => ({ value, label: value, content: value })),
    correct: ["0"],
    explanation: "投稿後に正解と解説を調整してください。"
  };
}

function isLayoutCommand(line: string): boolean {
  return (
    /^\\(?:pagecolor|linespread|geometry|newgeometry|definecolor|setmainfont|setmainjfont|setsansjfont)\b/.test(line) ||
    /^\\(?:usepackage|graphicspath|captionsetup|pagestyle|fancyhf|fancyfoot)\b/.test(line)
  );
}

function imageStyleFromOptions(rawOptions: string | undefined): Record<string, string> | undefined {
  if (!rawOptions) {
    return undefined;
  }

  const options = texOptionsToMap(rawOptions);
  const style: Record<string, string> = {};
  const width = options.get("width");
  const height = options.get("height");
  const maxWidth = options.get("max width");
  const maxHeight = options.get("max height");
  const scale = Number(options.get("scale"));
  const trim = options.get("trim");

  const cssWidth = width ? texLengthToCss(width) : undefined;
  const cssHeight = height ? texLengthToCss(height) : undefined;
  const cssMaxWidth = maxWidth ? texLengthToCss(maxWidth) : undefined;
  const cssMaxHeight = maxHeight ? texLengthToCss(maxHeight) : undefined;

  if (cssWidth) {
    style.width = cssWidth;
  }
  if (cssHeight) {
    style.height = cssHeight;
  }
  if (cssMaxWidth) {
    style.maxWidth = cssMaxWidth;
  }
  if (cssMaxHeight) {
    style.maxHeight = cssMaxHeight;
  }
  if (Number.isFinite(scale) && scale > 0) {
    if (!style.width) {
      style.width = `${scale * 100}%`;
    } else {
      style.transform = `scale(${scale})`;
      style.transformOrigin = "top center";
    }
  }
  if (options.has("keepaspectratio")) {
    style.height = style.height ?? "auto";
    style.objectFit = "contain";
  }
  if (trim && options.has("clip")) {
    const [left, bottom, right, top] = trim.split(/\s+/).map((value) => texLengthToCss(value) ?? "0");
    style.clipPath = `inset(${top ?? "0"} ${right ?? "0"} ${bottom ?? "0"} ${left ?? "0"})`;
  }

  return Object.keys(style).length ? style : undefined;
}

function layoutFromSection(section: DraftSection, environmentSource: string) {
  const body = [environmentSource, section.body, ...section.subsections.map((subsection) => subsection.body)].join("\n");
  const colors = texColorMap(body);
  const layout: NonNullable<ExamPage["layout"]> = {};

  body.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    const pageColor = line.match(/^\\pagecolor(?:\[(RGB)\])?\{([^}]*)\}$/);
    if (pageColor) {
      const value = pageColor[1] === "RGB" ? `RGB(${pageColor[2]})` : pageColor[2];
      layout.pageColor = cssColorFromTex(value, colors);
      return;
    }

    const lineSpread = line.match(/^\\linespread\{([^}]*)\}$/);
    if (lineSpread) {
      const value = Number(lineSpread[1]);
      if (Number.isFinite(value) && value > 0) {
        layout.lineHeight = value * 1.15;
      }
      return;
    }

    const geometry = line.match(/^\\(?:newgeometry|geometry)\{([^}]*)\}$/);
    if (geometry) {
      const options = texOptionsToMap(geometry[1]);
      layout.paddingTop = texLengthToCss(options.get("top") ?? "") ?? layout.paddingTop;
      layout.paddingBottom = texLengthToCss(options.get("bottom") ?? "") ?? layout.paddingBottom;
      layout.paddingLeft = texLengthToCss(options.get("inner") ?? options.get("left") ?? "") ?? layout.paddingLeft;
      layout.paddingRight = texLengthToCss(options.get("outer") ?? options.get("right") ?? "") ?? layout.paddingRight;
    }
  });

  return Object.keys(layout).length ? layout : undefined;
}

function paragraphBlocks(body: string): ProblemBlock[] {
  const imageCaption = (imageSource: string) => {
    if (imageSource.startsWith("data:")) {
      return "アップロード画像";
    }

    return imageSource.split("/").at(-1) || imageSource;
  };

  return body
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map<ProblemBlock | null>((text) => {
      if (text.startsWith("$$") && text.endsWith("$$")) {
        return { type: "formula", latex: text.slice(2, -2) };
      }

      if (isLayoutCommand(text)) {
        return null;
      }

      const imageMatch = text.match(/^\\includegraphics(?:\[([^\]]*)\])?\{([^}]*)\}$/);
      if (imageMatch) {
        const [_full, options, imageSource] = imageMatch;
        const caption = imageSource.startsWith("data:") ? imageCaption(imageSource) : "";
        return {
          type: "figure",
          caption,
          alt: caption,
          imageUrl: imageSource,
          imageOptions: options,
          imageStyle: imageStyleFromOptions(options)
        };
      }

      if (text.includes("\\begin{tikzpicture}") || text.includes("\\end{tikzpicture}")) {
        return { type: "figure", caption: "TikZ source", alt: "TikZ source", tikz: text };
      }

      if (text.startsWith("【注】")) {
        return { type: "note", text: text.slice(3) };
      }

      return { type: "paragraph", text };
    })
    .filter((block): block is ProblemBlock => block !== null);
}

function buildSectionPageBlocks(section: DraftSection, questions: QuestionSlot[], questionIndex: { value: number }) {
  const blocks: ProblemBlock[] = [];
  blocks.push({ type: "heading", text: section.title, level: 2 });
  blocks.push(...paragraphBlocks(section.body));
  section.marks.forEach(() => {
    const question = questions[questionIndex.value];
    questionIndex.value += 1;
    if (question) {
      blocks.push({ type: "question", questionId: question.id });
    }
  });
  section.subsections.forEach((subsection) => {
    if (!shouldOmitSubsectionTitle(section, subsection)) {
      blocks.push({ type: "heading", text: subsection.title, level: 3 });
    }
    blocks.push(...paragraphBlocks(subsection.body));
    subsection.marks.forEach(() => {
      const question = questions[questionIndex.value];
      questionIndex.value += 1;
      if (question) {
        blocks.push({ type: "question", questionId: question.id });
      }
    });
  });

  return blocks;
}

function sectionHasAuthoredBody(section: DraftSection): boolean {
  return Boolean(section.body.trim() || section.subsections.some((subsection) => subsection.body.trim()));
}

function findInitialPageForSection(
  initialExam: Exam | null | undefined,
  section: DraftSection,
  sectionIndex: number
): ExamPage | null {
  if (!initialExam) {
    return null;
  }

  return (
    initialExam.pages.find((page) => sectionKeyFromTitle(page.title) === section.title) ??
    initialExam.pages[sectionIndex] ??
    null
  );
}

function buildDraftPages(
  draft: ExamDraft,
  questions: QuestionSlot[],
  meta: AuthoringMeta,
  initialExam: Exam | null | undefined,
  environmentSource: string
): ExamPage[] {
  if (!draft.sections.length) {
    return [
      {
        id: draftPageId(0),
        pageNumber: 1,
        title: meta.title,
        blocks: [{ type: "heading", text: meta.title, level: 2 }]
      }
    ];
  }

  const questionIndex = { value: 0 };
  return draft.sections.map((section, sectionIndex) => {
    const initialPage = findInitialPageForSection(initialExam, section, sectionIndex);
    const shouldUseExactPage = Boolean(initialPage?.pageImageUrl && !sectionHasAuthoredBody(section));

    return {
      id: draftPageId(sectionIndex),
      pageNumber: sectionIndex + 1,
      title: section.title,
      pageImageUrl: shouldUseExactPage ? initialPage?.pageImageUrl : undefined,
      pageImageAlt: shouldUseExactPage ? initialPage?.pageImageAlt : undefined,
      markAreas: shouldUseExactPage ? initialPage?.markAreas : undefined,
      layout: shouldUseExactPage ? undefined : layoutFromSection(section, environmentSource),
      blocks: buildSectionPageBlocks(section, questions, questionIndex)
    };
  });
}

function answerValues(mark: DraftMark): string[] {
  return mark.answer.split("|").map((value) => value.trim()).filter(Boolean);
}

function optionsFromMark(mark: DraftMark) {
  return normalizeMarkChoices(mark).map((choice) => ({
    value: choice.value,
    label: choice.value,
    content: choice.content || choice.value
  }));
}

export function buildPublishedExam(
  meta: AuthoringMeta,
  source: string,
  initialExam: Exam | null | undefined,
  environmentSource: string,
  coverSource: string
): Exam {
  const draft = normalizeSourceDraft(parseAuthoringDraft(source));
  const draftEntries = getDraftMarkEntries(draft);
  const questionCount = Math.max(1, meta.questionCount);
  const questions = draftEntries.length
    ? draftEntries.map<QuestionSlot>((entry, index) => {
        const existingQuestion = initialExam?.questions[index];
        return {
          id: existingQuestion?.id ?? `draft-q${String(index + 1).padStart(2, "0")}`,
          label: entry.mark.label,
          section: entry.sectionTitle,
          prompt: existingQuestion?.prompt ?? "作成したフォームに対応する解答欄です。",
          pageId: draftPageId(entry.sectionIndex),
          points: entry.mark.points,
          multi: entry.mark.multi || answerValues(entry.mark).length > 1,
          options: optionsFromMark(entry.mark),
          correct: answerValues(entry.mark),
          explanation: existingQuestion?.explanation ?? "投稿後に解説を調整してください。"
        };
      })
    : Array.from({ length: questionCount }, (_item, index) =>
        createDefaultQuestion(index, meta.totalPoints, questionCount)
      );
  const fallbackBlocks: ProblemBlock[] = [
    { type: "heading", text: meta.title, level: 2 },
    ...questions.map<ProblemBlock>((question) => ({ type: "question", questionId: question.id }))
  ];
  const pages: ExamPage[] = draftEntries.length
    ? buildDraftPages(draft, questions, meta, initialExam, environmentSource)
    : [
        {
          id: draftPageId(0),
          pageNumber: 1,
          title: meta.title,
          blocks: fallbackBlocks
        }
      ];

  if (initialExam) {
    return {
      ...initialExam,
      title: meta.title,
      subject: meta.subject,
      description: meta.description,
      instructions: coverInstructionsFromSource(coverSource),
      durationMinutes: meta.durationMinutes,
      totalPoints: meta.totalPoints,
      pages,
      questions,
      published: true
    };
  }

  return {
    id: `custom-${Date.now()}`,
    title: meta.title,
    subject: meta.subject,
    durationMinutes: meta.durationMinutes,
    published: true,
    totalPoints: meta.totalPoints,
    description: meta.description,
    source: {
      kind: "structured",
      markPlacement: "generated"
    },
    instructions: coverInstructionsFromSource(coverSource),
    pages,
    questions
  };
}
