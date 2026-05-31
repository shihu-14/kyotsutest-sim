import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import type { AuthoringMeta, Exam, ExamPage, ProblemBlock, QuestionSlot, UserAnswers } from "../types";
import { ProblemBooklet } from "./ProblemBooklet";
import {
  countDraftMarks,
  createDefaultChoices,
  getDraftMarkEntries,
  normalizeMarkChoices,
  parseAuthoringDraft,
  serializeAuthoringDraft,
  sumDraftPoints,
  type DraftChoice,
  type DraftMark,
  type DraftSection,
  type DraftSubsection,
  type ExamDraft
} from "../utils/authoringDraft";
import { defaultAuthoringMeta, defaultAuthoringSource, parseAuthoringLatex } from "../utils/latex";
import { loadAuthorMeta, loadAuthorSource, saveAuthorMeta, saveAuthorSource } from "../utils/storage";

interface AuthoringEditorProps {
  initialExam?: Exam | null;
  onBack: () => void;
  onPublish: (exam: Exam) => void;
}

type TextMetaKey = "title" | "subject" | "description";
type NumberMetaKey = "questionCount" | "totalPoints" | "durationMinutes";
type InspectorTab = "preview" | "tex";

const textFields: Array<{ key: TextMetaKey; label: string; multiline?: boolean }> = [
  { key: "title", label: "タイトル" },
  { key: "subject", label: "科目名" },
  { key: "description", label: "説明", multiline: true }
];

const numberFields: Array<{ key: NumberMetaKey; label: string; suffix: string }> = [
  { key: "questionCount", label: "設問数", suffix: "問" },
  { key: "totalPoints", label: "配点", suffix: "点" },
  { key: "durationMinutes", label: "制限時間", suffix: "分" }
];
const previewAnswers: UserAnswers = {};
const ignorePreviewAnswer = () => undefined;
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

function sameMeta(left: AuthoringMeta, right: AuthoringMeta): boolean {
  return (
    left.title === right.title &&
    left.subject === right.subject &&
    left.description === right.description &&
    left.questionCount === right.questionCount &&
    left.totalPoints === right.totalPoints &&
    left.durationMinutes === right.durationMinutes
  );
}

function metaFromExam(exam: Exam | null | undefined): AuthoringMeta {
  if (!exam) {
    return loadAuthorMeta(defaultAuthoringMeta);
  }

  return {
    title: exam.title,
    subject: exam.subject,
    description: exam.description,
    questionCount: exam.questions.length,
    totalPoints: exam.totalPoints,
    durationMinutes: exam.durationMinutes
  };
}

function createDraftMark(label: string, points = 1): DraftMark {
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

function createDraftSection(index: number): DraftSection {
  return {
    id: `section-${index + 1}`,
    title: `第${index + 1}問`,
    body: "",
    marks: [],
    subsections: []
  };
}

function createDraftSubsection(sectionIndex: number, subsectionIndex: number): DraftSubsection {
  return {
    id: `section-${sectionIndex + 1}-subsection-${subsectionIndex + 1}`,
    title: `問${subsectionIndex + 1}`,
    body: "",
    marks: []
  };
}

function cloneDraft(draft: ExamDraft): ExamDraft {
  return {
    sections: draft.sections.map((section) => ({
      ...section,
      marks: section.marks.map((mark) => ({ ...mark, optionContents: mark.optionContents.map((choice) => ({ ...choice })) })),
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

function positiveChoiceCount(count: number): number {
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
}

function normalizeDraft(draft: ExamDraft): ExamDraft {
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

function serializeMarkForSection(mark: DraftMark): string {
  const attrs = [
    `answer=${mark.answer}`,
    `points=${Math.max(0, mark.points)}`,
    `choices=${positiveChoiceCount(mark.choices)}`,
    mark.multi ? "multi=true" : ""
  ].filter(Boolean);

  return `\\mark[${attrs.join(",")}]{${mark.label}}`;
}

function serializeChoiceForSection(mark: DraftMark, choice: DraftChoice): string {
  return `\\choice{${mark.label}}{${choice.value}}{${choice.content}}`;
}

function serializeSectionSource(section: DraftSection): string {
  const lines = [`\\sectiontitle{${section.title}}`];

  if (section.body.trim()) {
    lines.push(...section.body.trim().split("\n"));
  }

  section.marks.forEach((mark) => {
    lines.push(serializeMarkForSection(mark));
    normalizeMarkChoices(mark).forEach((choice) => lines.push(serializeChoiceForSection(mark, choice)));
  });

  section.subsections.forEach((subsection) => {
    lines.push("", `\\subsectiontitle{${subsection.title}}`);
    if (subsection.body.trim()) {
      lines.push(...subsection.body.trim().split("\n"));
    }
    subsection.marks.forEach((mark) => {
      lines.push(serializeMarkForSection(mark));
      normalizeMarkChoices(mark).forEach((choice) => lines.push(serializeChoiceForSection(mark, choice)));
    });
  });

  return `${lines.join("\n").trim()}\n`;
}

function buildSectionCompileSource(meta: AuthoringMeta, section: DraftSection): string {
  return `${authoringTexPreamble}\n\\begin{document}\n\\examtitle{${meta.title}}\n${serializeSectionSource(section)}\\end{document}\n`;
}

function getSectionMarkEntries(section: DraftSection) {
  return [
    ...section.marks.map((mark) => ({ mark })),
    ...section.subsections.flatMap((subsection) => subsection.marks.map((mark) => ({ mark })))
  ];
}

function sectionPointTotal(section: DraftSection): number {
  return getSectionMarkEntries(section).reduce((sum, entry) => sum + entry.mark.points, 0);
}

function sectionMarkCount(section: DraftSection): number {
  return getSectionMarkEntries(section).length;
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
  return title.match(/第\d+問/)?.[0] ?? title.split(/\s+/)[0] ?? title;
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

  return normalizeDraft({ sections });
}

function sourceFromExam(exam: Exam | null | undefined): string {
  if (!exam) {
    return loadAuthorSource(defaultAuthoringSource);
  }

  return serializeAuthoringDraft(metaFromExam(exam), draftFromExam(exam));
}

function getMarkSections(source: string): string[] {
  const sections: string[] = [];
  let currentSection = "第1問";
  let currentSubsection = "";

  source.split("\n").forEach((line) => {
    const sectionMatch = line.match(/\\sectiontitle\{([^}]*)\}/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      currentSubsection = "";
    }

    const subsectionMatch = line.match(/\\subsectiontitle\{([^}]*)\}/);
    if (subsectionMatch) {
      currentSubsection = subsectionMatch[1];
    }

    const markCount = line.match(/\\mark(?:\[[^\]]*\])?\{([^}]*)\}/g)?.length ?? 0;
    for (let index = 0; index < markCount; index += 1) {
      sections.push(currentSubsection ? `${currentSection} ${currentSubsection}` : currentSection);
    }
  });

  return sections;
}

function validateAuthoring(source: string, meta: AuthoringMeta): string[] {
  const parsed = parseAuthoringLatex(source);
  const errors = [...parsed.errors];

  if (parsed.marks.length < meta.questionCount) {
    errors.push(`設定された設問数は${meta.questionCount}問ですが、問題文内のマークは${parsed.marks.length}個です。`);
  }

  if (parsed.marks.length > meta.questionCount) {
    errors.push(`問題文内のマークは${parsed.marks.length}個ですが、設定された設問数は${meta.questionCount}問です。`);
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

function paragraphBlocks(body: string): ProblemBlock[] {
  return body
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map<ProblemBlock>((text) => {
      if (text.startsWith("$$") && text.endsWith("$$")) {
        return { type: "formula", latex: text.slice(2, -2) };
      }

      const imageMatch = text.match(/^\\includegraphics\{([^}]*)\}$/);
      if (imageMatch) {
        return { type: "figure", caption: imageMatch[1], alt: imageMatch[1], imageUrl: imageMatch[1] };
      }

      if (text.includes("\\begin{tikzpicture}") || text.includes("\\end{tikzpicture}")) {
        return { type: "figure", caption: "TikZ source", alt: "TikZ source", tikz: text };
      }

      if (text.startsWith("【注】")) {
        return { type: "note", text: text.slice(3) };
      }

      return { type: "paragraph", text };
    });
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
    blocks.push({ type: "heading", text: subsection.title, level: 3 });
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

function buildDraftPages(draft: ExamDraft, questions: QuestionSlot[], meta: AuthoringMeta): ExamPage[] {
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
  return draft.sections.map((section, sectionIndex) => ({
    id: draftPageId(sectionIndex),
    pageNumber: sectionIndex + 1,
    title: section.title,
    blocks: buildSectionPageBlocks(section, questions, questionIndex)
  }));
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

function buildPublishedExam(meta: AuthoringMeta, source: string, initialExam: Exam | null | undefined): Exam {
  const draft = normalizeDraft(parseAuthoringDraft(source));
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
    ? buildDraftPages(draft, questions, meta)
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
    instructions: [
      "解答は右側のマークシート、または問題冊子中の選択肢をクリックして行うこと。",
      "制限時間が終了すると自動的に採点へ移る。"
    ],
    pages,
    questions
  };
}

export function AuthoringEditor({ initialExam = null, onBack, onPublish }: AuthoringEditorProps) {
  const [source, setSource] = useState(() => sourceFromExam(initialExam));
  const [meta, setMeta] = useState(() => metaFromExam(initialExam));
  const [savedSource, setSavedSource] = useState(source);
  const [savedMeta, setSavedMeta] = useState(meta);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "published">("idle");
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("preview");
  const validationErrors = useMemo(() => validateAuthoring(source, meta), [source, meta]);
  const draft = useMemo(() => normalizeDraft(parseAuthoringDraft(source)), [source]);
  const previewExam = useMemo(() => buildPublishedExam(meta, source, initialExam), [initialExam, meta, source]);
  const selectedSection =
    draft.sections[Math.min(selectedSectionIndex, Math.max(0, draft.sections.length - 1))] ?? null;
  const selectedPage = previewExam.pages[Math.min(selectedSectionIndex, Math.max(0, previewExam.pages.length - 1))] ?? null;
  const selectedSectionSource = selectedSection ? serializeSectionSource(selectedSection) : "";
  const selectedCompileSize = selectedSection ? buildSectionCompileSource(meta, selectedSection).length : 0;
  const sectionTotals = useMemo(
    () =>
      draft.sections.map((section) => ({
        marks: sectionMarkCount(section),
        points: sectionPointTotal(section)
      })),
    [draft.sections]
  );
  const sourceStats = useMemo(() => {
    const parsed = parseAuthoringLatex(source);
    return {
      lines: source.split("\n").length,
      marks: parsed.marks.length,
      sections: draft.sections.length,
      subsections: draft.sections.reduce((sum, section) => sum + section.subsections.length, 0),
      answerSlots: source.match(/\\counterbox/g)?.length ?? 0
    };
  }, [draft, source]);
  const isDirty = source !== savedSource || !sameMeta(meta, savedMeta);

  const saveDraft = () => {
    saveAuthorSource(source);
    saveAuthorMeta(meta);
    setSavedSource(source);
    setSavedMeta(meta);
  };

  const publishDraft = () => {
    if (validationErrors.length) {
      setShowValidationErrors(true);
      return;
    }

    saveDraft();
    setPublishState("published");
    onPublish(buildPublishedExam(meta, source, initialExam));
  };

  const requestBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    onBack();
  };

  const updateTextMeta = (key: TextMetaKey, value: string) => {
    setMeta((current) => ({ ...current, [key]: value }));
  };

  const updateNumberMeta = (key: NumberMetaKey, value: string) => {
    const numericValue = Number(value);
    setMeta((current) => ({ ...current, [key]: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0 }));
  };

  const applyDraft = (nextDraft: ExamDraft) => {
    const normalizedDraft = normalizeDraft(nextDraft);
    const nextQuestionCount = countDraftMarks(normalizedDraft);
    const nextTotalPoints = sumDraftPoints(normalizedDraft);
    const nextMeta = {
      ...meta,
      questionCount: nextQuestionCount || meta.questionCount,
      totalPoints: nextQuestionCount ? nextTotalPoints : meta.totalPoints
    };
    setMeta(nextMeta);
    setSource(serializeAuthoringDraft(nextMeta, normalizedDraft));
  };

  const applySelectedSectionSource = (nextSectionSource: string) => {
    if (!selectedSection) {
      return;
    }

    const parsed = normalizeDraft(parseAuthoringDraft(nextSectionSource));
    const nextSection = parsed.sections[0] ?? createDraftSection(selectedSectionIndex);
    const nextDraft = cloneDraft(draft);
    nextDraft.sections[selectedSectionIndex] = {
      ...nextSection,
      id: selectedSection.id
    };
    applyDraft(nextDraft);
  };

  return (
    <main className="author-layout">
      <header className="author-topbar">
        <div>
          <p className="eyebrow">{initialExam ? "Edit exam" : "New exam"} / Authoring console</p>
          <h1>{initialExam ? meta.title || initialExam.title : "新規作成"}</h1>
        </div>
        <dl className="author-summary" aria-label="編集サマリー">
          <div>
            <dt>大問</dt>
            <dd>{draft.sections.length}</dd>
          </div>
          <div>
            <dt>解答欄</dt>
            <dd>{sourceStats.marks}</dd>
          </div>
          <div className={sumDraftPoints(draft) === meta.totalPoints ? "" : "mismatch"}>
            <dt>配点</dt>
            <dd>
              {sumDraftPoints(draft)}/{meta.totalPoints}
            </dd>
          </div>
        </dl>
        <div className="author-actions">
          <span className={`save-state ${isDirty ? "dirty" : ""}`}>
            {publishState === "published" ? "投稿済み" : isDirty ? "未保存" : "保存済み"}
          </span>
          <button className="secondary-button" type="button" onClick={() => setShowSettingsDialog(true)}>
            設定
          </button>
          <button className="primary-button" type="button" onClick={saveDraft}>
            一時保存
          </button>
          <button className="primary-button" type="button" onClick={publishDraft}>
            投稿
          </button>
          <button className="secondary-button" type="button" onClick={requestBack}>
            戻る
          </button>
        </div>
      </header>

      <section className="author-workspace">
        <SectionNavigator
          draft={draft}
          sectionTotals={sectionTotals}
          selectedSectionIndex={selectedSectionIndex}
          onAddSection={() => {
            applyDraft({ sections: [...draft.sections, createDraftSection(draft.sections.length)] });
            setSelectedSectionIndex(draft.sections.length);
          }}
          onSelectSection={setSelectedSectionIndex}
        />

        <section className="section-editor-pane" aria-label="選択中の大問編集">
          {selectedSection ? (
            <SectionEditor
              section={selectedSection}
              sectionIndex={selectedSectionIndex}
              onChange={(nextSection) => {
                const nextDraft = cloneDraft(draft);
                nextDraft.sections[selectedSectionIndex] = nextSection;
                applyDraft(nextDraft);
              }}
            />
          ) : null}
        </section>

        <aside className="inspector-pane">
          <section className="inspector-shell" aria-label="大問プレビューとTeX">
            <div className="inspector-heading">
              <div>
                <p className="eyebrow">Section compiler</p>
                <h2>{selectedSection?.title ?? "大問"}</h2>
              </div>
              <div className="inspector-tabs" role="tablist" aria-label="プレビューとTeX">
                <button
                  aria-selected={inspectorTab === "preview"}
                  className={inspectorTab === "preview" ? "active" : ""}
                  role="tab"
                  type="button"
                  onClick={() => setInspectorTab("preview")}
                >
                  プレビュー
                </button>
                <button
                  aria-selected={inspectorTab === "tex"}
                  className={inspectorTab === "tex" ? "active" : ""}
                  role="tab"
                  type="button"
                  onClick={() => setInspectorTab("tex")}
                >
                  大問TeX
                </button>
              </div>
            </div>
            {inspectorTab === "preview" && selectedPage ? (
              <PublishedSectionPreview exam={previewExam} page={selectedPage} />
            ) : null}
            {inspectorTab === "tex" && selectedSection ? (
              <SectionTexEditor
                compileSize={selectedCompileSize}
                source={selectedSectionSource}
                onChange={applySelectedSectionSource}
              />
            ) : null}
            {showValidationErrors && validationErrors.length ? (
              <div className="validation-errors" role="alert">
                <strong>投稿できません</strong>
                <ul>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </aside>
      </section>

      {showSettingsDialog ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="confirm-dialog settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-dialog-title"
          >
            <h2 id="settings-dialog-title">設定</h2>
            <div className="meta-form">
              {textFields.map((field) => (
                <label className={field.multiline ? "wide" : ""} key={field.key}>
                  <span>{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      rows={3}
                      value={meta[field.key]}
                      onChange={(event) => updateTextMeta(field.key, event.currentTarget.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={meta[field.key]}
                      onChange={(event) => updateTextMeta(field.key, event.currentTarget.value)}
                    />
                  )}
                </label>
              ))}
              {numberFields.map((field) => (
                <label key={field.key}>
                  <span>{field.label}</span>
                  <div className="number-input">
                    <input
                      min={0}
                      type="number"
                      value={meta[field.key]}
                      onChange={(event) => updateNumberMeta(field.key, event.currentTarget.value)}
                    />
                    <small>{field.suffix}</small>
                  </div>
                </label>
              ))}
            </div>
            <div className="dialog-actions">
              <button className="primary-button" type="button" onClick={() => setShowSettingsDialog(false)}>
                閉じる
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showLeaveDialog ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
            <h2 id="leave-dialog-title">未保存の変更があります</h2>
            <p>保存して戻るか、保存せずに戻るかを選んでください。</p>
            <div className="dialog-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  saveDraft();
                  onBack();
                }}
              >
                保存して戻る
              </button>
              <button className="danger-button" type="button" onClick={onBack}>
                保存せず戻る
              </button>
              <button className="secondary-button" type="button" onClick={() => setShowLeaveDialog(false)}>
                キャンセル
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

interface SectionNavigatorProps {
  draft: ExamDraft;
  sectionTotals: Array<{ marks: number; points: number }>;
  selectedSectionIndex: number;
  onAddSection: () => void;
  onSelectSection: (sectionIndex: number) => void;
}

function SectionNavigator({
  draft,
  sectionTotals,
  selectedSectionIndex,
  onAddSection,
  onSelectSection
}: SectionNavigatorProps) {
  return (
    <aside className="section-nav-pane" aria-label="大問一覧">
      <div className="section-nav-head">
        <div>
          <p className="eyebrow">Sections</p>
          <h2>大問一覧</h2>
        </div>
        <button className="compact secondary-button" type="button" onClick={onAddSection}>
          追加
        </button>
      </div>
      <div className="section-nav-list">
        {draft.sections.map((section, index) => {
          const totals = sectionTotals[index] ?? { marks: 0, points: 0 };
          return (
            <button
              aria-current={index === selectedSectionIndex ? "page" : undefined}
              className={index === selectedSectionIndex ? "active" : ""}
              key={section.id}
              type="button"
              onClick={() => onSelectSection(index)}
            >
              <span>{section.title}</span>
              <small>
                {totals.marks}欄 / {totals.points}点
              </small>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function PublishedSectionPreview({ exam, page }: { exam: Exam; page: ExamPage }) {
  const questionsById = useMemo(
    () => new Map(exam.questions.map((question) => [question.id, question])),
    [exam.questions]
  );

  return (
    <div className="published-section-preview">
      <section
        className={`published-preview-page ${page.pageImageUrl ? "exact" : ""}`}
        aria-label={`${page.title}のプレビュー`}
      >
        <div className="published-preview-caption">
          <span>{page.pageNumber}</span>
          <strong>{page.title}</strong>
        </div>
        <ProblemBooklet
          answers={previewAnswers}
          page={page}
          questionsById={questionsById}
          onToggleAnswer={ignorePreviewAnswer}
        />
      </section>
    </div>
  );
}

interface SectionTexEditorProps {
  compileSize: number;
  source: string;
  onChange: (source: string) => void;
}

function SectionTexEditor({ compileSize, source, onChange }: SectionTexEditorProps) {
  return (
    <div className="section-tex-editor">
      <div className="tex-runtime-strip" aria-label="TeX共通設定">
        <span>共通パッケージとマクロは裏で読み込み済み</span>
        <code>{Math.ceil(compileSize / 1024)}KB unit</code>
      </div>
      <Editor
        height="calc(100vh - 252px)"
        defaultLanguage="latex"
        theme="vs-light"
        value={source}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true
        }}
        onChange={(nextSource) => onChange(nextSource ?? "")}
      />
    </div>
  );
}

interface SectionEditorProps {
  section: DraftSection;
  sectionIndex: number;
  onChange: (section: DraftSection) => void;
}

function SectionEditor({ section, sectionIndex, onChange }: SectionEditorProps) {
  const updateSection = (updates: Partial<DraftSection>) => {
    onChange({ ...section, ...updates });
  };
  const updateSubsection = (
    subsectionIndex: number,
    updates: Partial<DraftSubsection>
  ) => {
    const subsections = section.subsections.map((subsection, index) =>
      index === subsectionIndex ? { ...subsection, ...updates } : subsection
    );
    updateSection({ subsections });
  };

  const updateMark = (
    subsectionIndex: number | null,
    markIndex: number,
    updates: Partial<DraftMark>
  ) => {
    if (subsectionIndex === null) {
      const marks = section.marks.map((mark, index) => (index === markIndex ? { ...mark, ...updates } : mark));
      updateSection({ marks });
      return;
    }

    const subsections = section.subsections.map((subsection, index) => {
      if (index !== subsectionIndex) {
        return subsection;
      }

      return {
        ...subsection,
        marks: subsection.marks.map((mark, itemIndex) =>
          itemIndex === markIndex ? { ...mark, ...updates } : mark
        )
      };
    });
    updateSection({ subsections });
  };

  const addSubsection = () => {
    updateSection({
      subsections: [...section.subsections, createDraftSubsection(sectionIndex, section.subsections.length)]
    });
  };

  const addMark = (subsectionIndex: number | null) => {
    const mark = createDraftMark(String(sectionMarkCount(section) + 1));
    if (subsectionIndex === null) {
      updateSection({ marks: [...section.marks, mark] });
      return;
    }

    const subsections = section.subsections.map((subsection, index) =>
      index === subsectionIndex ? { ...subsection, marks: [...subsection.marks, mark] } : subsection
    );
    updateSection({ subsections });
  };

  const removeMark = (subsectionIndex: number | null, markIndex: number) => {
    if (subsectionIndex === null) {
      updateSection({ marks: section.marks.filter((_mark, index) => index !== markIndex) });
      return;
    }

    const subsections = section.subsections.map((subsection, index) =>
      index === subsectionIndex
        ? { ...subsection, marks: subsection.marks.filter((_mark, itemIndex) => itemIndex !== markIndex) }
        : subsection
    );
    updateSection({ subsections });
  };

  return (
    <div className="section-editor">
      <div className="section-editor-head">
        <div>
          <p className="eyebrow">Structured form</p>
          <h2>{section.title}</h2>
        </div>
        <div className="section-editor-actions">
          <button className="secondary-button compact" type="button" onClick={addSubsection}>
            小問追加
          </button>
          <button className="primary-button compact" type="button" onClick={() => addMark(null)}>
            解答欄追加
          </button>
        </div>
      </div>
      <label className="section-body-field">
        <span>本文</span>
        <textarea
          aria-label={`${section.title} 本文`}
          rows={6}
          value={section.body}
          onChange={(event) => updateSection({ body: event.currentTarget.value })}
        />
      </label>
      <section className="answer-editor-group" aria-label={`${section.title} 解答欄`}>
        <div className="answer-editor-head">
          <h3>解答欄</h3>
          <small>{section.marks.length}件</small>
        </div>
        <MarkList
          marks={section.marks}
          prefix={section.title}
          onRemove={(markIndex) => removeMark(null, markIndex)}
          onUpdate={(markIndex, updates) => updateMark(null, markIndex, updates)}
        />
      </section>
      {section.subsections.map((subsection, subsectionIndex) => (
        <section className="subsection-editor" key={subsection.id}>
          <div className="subsection-editor-head">
            <label>
              <span>小問</span>
              <input
                aria-label={`${section.title} 小問 ${subsectionIndex + 1} タイトル`}
                value={subsection.title}
                onChange={(event) => updateSubsection(subsectionIndex, { title: event.currentTarget.value })}
              />
            </label>
            <button className="secondary-button compact" type="button" onClick={() => addMark(subsectionIndex)}>
              解答欄追加
            </button>
          </div>
          <label className="section-body-field">
            <span>本文</span>
            <textarea
              aria-label={`${section.title} ${subsection.title} 本文`}
              rows={4}
              value={subsection.body}
              onChange={(event) => updateSubsection(subsectionIndex, { body: event.currentTarget.value })}
            />
          </label>
          <MarkList
            marks={subsection.marks}
            prefix={`${section.title} ${subsection.title}`}
            onRemove={(markIndex) => removeMark(subsectionIndex, markIndex)}
            onUpdate={(markIndex, updates) => updateMark(subsectionIndex, markIndex, updates)}
          />
        </section>
      ))}
    </div>
  );
}

interface MarkListProps {
  marks: DraftMark[];
  prefix: string;
  onRemove: (markIndex: number) => void;
  onUpdate: (markIndex: number, updates: Partial<DraftMark>) => void;
}

function choiceText(mark: DraftMark): string {
  return normalizeMarkChoices(mark)
    .map((choice) => choice.content)
    .join("\n");
}

function choicesFromText(text: string): DraftChoice[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const contents = lines.length ? lines : ["1"];
  return contents.map((content, index) => ({ value: String(index + 1), content }));
}

function resizeChoices(mark: DraftMark, choices: number): DraftChoice[] {
  return normalizeMarkChoices({ ...mark, choices });
}

function positiveInputNumber(value: string): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(1, numericValue) : 1;
}

function answerValuesFromMark(mark: DraftMark): string[] {
  return mark.answer.split("|").map((value) => value.trim()).filter(Boolean);
}

function MarkList({ marks, prefix, onRemove, onUpdate }: MarkListProps) {
  const [expandedChoices, setExpandedChoices] = useState<Set<string>>(() => new Set());

  if (!marks.length) {
    return <p className="empty-answer-list">この範囲には解答欄がありません。</p>;
  }

  const toggleChoiceEditor = (markId: string) => {
    setExpandedChoices((current) => {
      const next = new Set(current);
      if (next.has(markId)) {
        next.delete(markId);
      } else {
        next.add(markId);
      }
      return next;
    });
  };

  const updateCorrectAnswer = (markIndex: number, mark: DraftMark, value: string) => {
    if (!mark.multi) {
      onUpdate(markIndex, { answer: value });
      return;
    }

    const currentValues = answerValuesFromMark(mark);
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((candidate) => candidate !== value)
      : [...currentValues, value];
    onUpdate(markIndex, { answer: nextValues.join("|") });
  };

  return (
    <div className="structure-mark-list">
      {marks.map((mark, markIndex) => (
        <div className="structure-mark-row" key={mark.id}>
          <div className="structure-mark-number" aria-label={`解答番号 ${mark.label}`}>
            <span>解答番号</span>
            <strong>{mark.label}</strong>
          </div>
          <label>
            <span>配点</span>
            <input
              aria-label={`${mark.label} 配点`}
              min={0}
              type="number"
              value={mark.points}
              onChange={(event) => onUpdate(markIndex, { points: Number(event.currentTarget.value) })}
            />
          </label>
          <label>
            <span>選択肢数</span>
            <input
              aria-label={`${mark.label} 選択肢数`}
              min={1}
              type="number"
              value={mark.choices}
              onChange={(event) => {
                const choices = positiveInputNumber(event.currentTarget.value);
                onUpdate(markIndex, { choices, optionContents: resizeChoices(mark, choices) });
              }}
            />
          </label>
          <label>
            <span>正解番号</span>
            <div className="answer-choice-buttons" aria-label={`${mark.label} 正解番号`}>
              {normalizeMarkChoices(mark).map((choice) => {
                const selected = answerValuesFromMark(mark).includes(choice.value);
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "selected" : ""}
                    key={choice.value}
                    type="button"
                    onClick={() => updateCorrectAnswer(markIndex, mark, choice.value)}
                  >
                    {choice.value}
                  </button>
                );
              })}
            </div>
          </label>
          <label className="structure-check">
            <input
              aria-label={`${mark.label} 複数回答`}
              checked={mark.multi}
              type="checkbox"
              onChange={(event) => {
                const multi = event.currentTarget.checked;
                const firstAnswer = answerValuesFromMark(mark)[0] ?? "1";
                onUpdate(markIndex, { multi, answer: multi ? mark.answer : firstAnswer });
              }}
            />
            <span>複数</span>
          </label>
          <button className="secondary-button" type="button" onClick={() => onRemove(markIndex)}>
            削除
          </button>
          <button className="text-button compact" type="button" onClick={() => toggleChoiceEditor(mark.id)}>
            選択肢を編集
          </button>
          <span className="structure-mark-context">{prefix}</span>
          {expandedChoices.has(mark.id) ? (
            <label className="structure-choice-contents">
              <span>選択肢内容</span>
              <textarea
                aria-label={`${mark.label} マーク内容`}
                rows={Math.min(6, Math.max(2, mark.choices))}
                value={choiceText(mark)}
                onChange={(event) => {
                  const optionContents = choicesFromText(event.currentTarget.value);
                  onUpdate(markIndex, { choices: optionContents.length, optionContents });
                }}
              />
            </label>
          ) : null}
        </div>
      ))}
    </div>
  );
}
