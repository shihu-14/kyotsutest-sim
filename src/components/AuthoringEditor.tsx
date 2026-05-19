import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import type { AuthoringMeta, Exam, ProblemBlock, QuestionSlot } from "../types";
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
import { defaultAuthoringMeta, defaultAuthoringSource, parseAuthoringLatex, renderMathSegments } from "../utils/latex";
import { loadAuthorMeta, loadAuthorSource, saveAuthorMeta, saveAuthorSource } from "../utils/storage";

interface AuthoringEditorProps {
  initialExam?: Exam | null;
  onBack: () => void;
  onPublish: (exam: Exam) => void;
}

type TextMetaKey = "title" | "subject" | "description";
type NumberMetaKey = "questionCount" | "totalPoints" | "durationMinutes";
type AuthorMode = "form" | "tex";

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

function draftFromExam(exam: Exam): ExamDraft {
  const sections: DraftSection[] = [];

  exam.questions.forEach((question, index) => {
    const [sectionTitle, ...subsectionParts] = question.section.split(/\s+/);
    const subsectionTitle = subsectionParts.join(" ");
    let section = sections.find((candidate) => candidate.title === sectionTitle);
    if (!section) {
      section = createDraftSection(sections.length);
      section.title = sectionTitle || `第${sections.length + 1}問`;
      sections.push(section);
    }

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

  return { sections };
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
    pageId: "draft-p1",
    points,
    multi: false,
    options: ["0", "1", "2", "3", "4"].map((value) => ({ value, label: value, content: value })),
    correct: ["0"],
    explanation: "投稿後に正解と解説を調整してください。"
  };
}

function paragraphBlocks(body: string): ProblemBlock[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text) => ({ type: "paragraph", text }));
}

function buildDraftPageBlocks(draft: ExamDraft, questions: QuestionSlot[], meta: AuthoringMeta): ProblemBlock[] {
  const blocks: ProblemBlock[] = [];
  let questionIndex = 0;

  draft.sections.forEach((section) => {
    blocks.push({ type: "heading", text: section.title, level: 2 });
    blocks.push(...paragraphBlocks(section.body));
    section.marks.forEach(() => {
      const question = questions[questionIndex];
      questionIndex += 1;
      if (question) {
        blocks.push({ type: "question", questionId: question.id });
      }
    });
    section.subsections.forEach((subsection) => {
      blocks.push({ type: "heading", text: subsection.title, level: 3 });
      blocks.push(...paragraphBlocks(subsection.body));
      subsection.marks.forEach(() => {
        const question = questions[questionIndex];
        questionIndex += 1;
        if (question) {
          blocks.push({ type: "question", questionId: question.id });
        }
      });
    });
  });

  return blocks.length ? blocks : [{ type: "heading", text: meta.title, level: 2 }];
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
  const draft = parseAuthoringDraft(source);
  const draftEntries = getDraftMarkEntries(draft);
  const fallbackSections = getMarkSections(source);

  if (initialExam) {
    const questions = draftEntries.length
      ? draftEntries.map<QuestionSlot>((entry, index) => {
          const existingQuestion = initialExam.questions[index];
          return {
            id: existingQuestion?.id ?? `draft-q${String(index + 1).padStart(2, "0")}`,
            label: entry.mark.label,
            section: entry.sectionTitle,
            prompt: existingQuestion?.prompt ?? "作成したフォームに対応する解答欄です。",
            pageId: existingQuestion?.pageId ?? "draft-p1",
            points: entry.mark.points,
            multi: entry.mark.multi || answerValues(entry.mark).length > 1,
            options: optionsFromMark(entry.mark),
            correct: answerValues(entry.mark),
            explanation: existingQuestion?.explanation ?? "投稿後に解説を調整してください。"
          };
        })
      : initialExam.questions;

    return {
      ...initialExam,
      title: meta.title,
      subject: meta.subject,
      description: meta.description,
      durationMinutes: meta.durationMinutes,
      totalPoints: meta.totalPoints,
      questions,
      published: true
    };
  }

  const questionCount = Math.max(1, meta.questionCount);
  const questions = draftEntries.length
    ? draftEntries.map<QuestionSlot>((entry, index) => ({
        id: `draft-q${String(index + 1).padStart(2, "0")}`,
        label: entry.mark.label,
        section: entry.sectionTitle || fallbackSections[index] || `第${index + 1}問`,
        prompt: "作成したフォームに対応する解答欄です。",
        pageId: "draft-p1",
        points: entry.mark.points,
        multi: entry.mark.multi || answerValues(entry.mark).length > 1,
        options: optionsFromMark(entry.mark),
        correct: answerValues(entry.mark),
        explanation: "投稿後に解説を調整してください。"
      }))
    : Array.from({ length: questionCount }, (_item, index) =>
        createDefaultQuestion(index, meta.totalPoints, questionCount)
      );

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
    pages: [
      {
        id: "draft-p1",
        pageNumber: 1,
        title: meta.title,
        blocks: buildDraftPageBlocks(draft, questions, meta)
      }
    ],
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
  const [authorMode, setAuthorMode] = useState<AuthorMode>("form");
  const validationErrors = useMemo(() => validateAuthoring(source, meta), [source, meta]);
  const draft = useMemo(() => parseAuthoringDraft(source), [source]);
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
    const nextQuestionCount = countDraftMarks(nextDraft);
    const nextTotalPoints = sumDraftPoints(nextDraft);
    setMeta((current) => ({
      ...current,
      questionCount: nextQuestionCount || current.questionCount,
      totalPoints: nextQuestionCount ? nextTotalPoints : current.totalPoints
    }));
    setSource(serializeAuthoringDraft(meta, nextDraft));
  };

  return (
    <main className="author-layout">
      <header className="exam-toolbar">
        <div>
          <p className="eyebrow">New exam</p>
          <h1>新規作成</h1>
        </div>
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

      <section className="author-grid">
        <div className="editor-pane">
          <div className="editor-pane-header">
            <h2>{authorMode === "form" ? "作問フォーム" : "詳細TeX"}</h2>
            <div className="author-mode-tabs" role="tablist" aria-label="編集モード">
              <button
                aria-selected={authorMode === "form"}
                className={authorMode === "form" ? "active" : ""}
                role="tab"
                type="button"
                onClick={() => setAuthorMode("form")}
              >
                フォーム
              </button>
              <button
                aria-selected={authorMode === "tex"}
                className={authorMode === "tex" ? "active" : ""}
                role="tab"
                type="button"
                onClick={() => setAuthorMode("tex")}
              >
                詳細TeX
              </button>
            </div>
          </div>
          {authorMode === "form" ? (
            <StructureEditor draft={draft} onChange={applyDraft} />
          ) : (
            <Editor
              height="calc(100vh - 188px)"
              defaultLanguage="latex"
              theme="vs-light"
              value={source}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
                tabSize: 2,
                automaticLayout: true
              }}
              onChange={(nextSource) => setSource(nextSource ?? "")}
            />
          )}
        </div>

        <aside className="author-side">
          <section className="preview-pane" aria-label="共通テスト形式プレビュー">
            <div className="preview-heading">
              <h2>プレビュー</h2>
              <span>
                大問 {sourceStats.sections} / 小問 {sourceStats.subsections} / 解答欄{" "}
                {sourceStats.answerSlots || sourceStats.marks}
              </span>
            </div>
            <CommonTestPreview draft={draft} meta={meta} />
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

interface StructureEditorProps {
  draft: ExamDraft;
  onChange: (draft: ExamDraft) => void;
}

function StructureEditor({ draft, onChange }: StructureEditorProps) {
  const updateSection = (sectionIndex: number, updates: Partial<DraftSection>) => {
    const nextDraft = cloneDraft(draft);
    nextDraft.sections[sectionIndex] = { ...nextDraft.sections[sectionIndex], ...updates };
    onChange(nextDraft);
  };

  const updateSubsection = (
    sectionIndex: number,
    subsectionIndex: number,
    updates: Partial<DraftSubsection>
  ) => {
    const nextDraft = cloneDraft(draft);
    nextDraft.sections[sectionIndex].subsections[subsectionIndex] = {
      ...nextDraft.sections[sectionIndex].subsections[subsectionIndex],
      ...updates
    };
    onChange(nextDraft);
  };

  const updateMark = (
    sectionIndex: number,
    subsectionIndex: number | null,
    markIndex: number,
    updates: Partial<DraftMark>
  ) => {
    const nextDraft = cloneDraft(draft);
    const marks =
      subsectionIndex === null
        ? nextDraft.sections[sectionIndex].marks
        : nextDraft.sections[sectionIndex].subsections[subsectionIndex].marks;
    marks[markIndex] = { ...marks[markIndex], ...updates };
    onChange(nextDraft);
  };

  const addSection = () => {
    onChange({ sections: [...draft.sections, createDraftSection(draft.sections.length)] });
  };

  const addSubsection = (sectionIndex: number) => {
    const nextDraft = cloneDraft(draft);
    const section = nextDraft.sections[sectionIndex];
    section.subsections.push(createDraftSubsection(sectionIndex, section.subsections.length));
    onChange(nextDraft);
  };

  const addMark = (sectionIndex: number, subsectionIndex: number | null) => {
    const nextDraft = cloneDraft(draft);
    const label = String(countDraftMarks(nextDraft) + 1);
    const target =
      subsectionIndex === null
        ? nextDraft.sections[sectionIndex].marks
        : nextDraft.sections[sectionIndex].subsections[subsectionIndex].marks;
    target.push(createDraftMark(label));
    onChange(nextDraft);
  };

  const removeMark = (sectionIndex: number, subsectionIndex: number | null, markIndex: number) => {
    const nextDraft = cloneDraft(draft);
    const target =
      subsectionIndex === null
        ? nextDraft.sections[sectionIndex].marks
        : nextDraft.sections[sectionIndex].subsections[subsectionIndex].marks;
    target.splice(markIndex, 1);
    onChange(nextDraft);
  };

  return (
    <section className="structure-editor" aria-label="問題構成エディタ">
      <div className="structure-heading">
        <h2>問題構成</h2>
        <button className="secondary-button" type="button" onClick={addSection}>
          大問追加
        </button>
      </div>
      {draft.sections.length ? (
        <div className="structure-list">
          {draft.sections.map((section, sectionIndex) => (
            <article className="structure-section" key={section.id}>
              <div className="structure-section-head">
                <label>
                  <span>大問</span>
                  <input
                    aria-label={`大問 ${sectionIndex + 1} タイトル`}
                    value={section.title}
                    onChange={(event) => updateSection(sectionIndex, { title: event.currentTarget.value })}
                  />
                </label>
                <button className="secondary-button" type="button" onClick={() => addSubsection(sectionIndex)}>
                  小問追加
                </button>
                <button className="secondary-button" type="button" onClick={() => addMark(sectionIndex, null)}>
                  マーク追加
                </button>
              </div>
              <label className="structure-body">
                <span>本文</span>
                <textarea
                  aria-label={`${section.title} 本文`}
                  rows={2}
                  value={section.body}
                  onChange={(event) => updateSection(sectionIndex, { body: event.currentTarget.value })}
                />
              </label>
              <MarkList
                marks={section.marks}
                prefix={section.title}
                onRemove={(markIndex) => removeMark(sectionIndex, null, markIndex)}
                onUpdate={(markIndex, updates) => updateMark(sectionIndex, null, markIndex, updates)}
              />
              {section.subsections.map((subsection, subsectionIndex) => (
                <section className="structure-subsection" key={subsection.id}>
                  <div className="structure-section-head">
                    <label>
                      <span>小問</span>
                      <input
                        aria-label={`${section.title} 小問 ${subsectionIndex + 1} タイトル`}
                        value={subsection.title}
                        onChange={(event) =>
                          updateSubsection(sectionIndex, subsectionIndex, { title: event.currentTarget.value })
                        }
                      />
                    </label>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => addMark(sectionIndex, subsectionIndex)}
                    >
                      マーク追加
                    </button>
                  </div>
                  <label className="structure-body">
                    <span>本文</span>
                    <textarea
                      aria-label={`${section.title} ${subsection.title} 本文`}
                      rows={2}
                      value={subsection.body}
                      onChange={(event) =>
                        updateSubsection(sectionIndex, subsectionIndex, { body: event.currentTarget.value })
                      }
                    />
                  </label>
                  <MarkList
                    marks={subsection.marks}
                    prefix={`${section.title} ${subsection.title}`}
                    onRemove={(markIndex) => removeMark(sectionIndex, subsectionIndex, markIndex)}
                    onUpdate={(markIndex, updates) =>
                      updateMark(sectionIndex, subsectionIndex, markIndex, updates)
                    }
                  />
                </section>
              ))}
            </article>
          ))}
        </div>
      ) : null}
    </section>
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

function MarkList({ marks, prefix, onRemove, onUpdate }: MarkListProps) {
  if (!marks.length) {
    return null;
  }

  return (
    <div className="structure-mark-list">
      {marks.map((mark, markIndex) => (
        <div className="structure-mark-row" key={mark.id}>
          <label>
            <span>番号</span>
            <input
              aria-label={`${mark.label} 解答番号`}
              value={mark.label}
              onChange={(event) => onUpdate(markIndex, { label: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>正解</span>
            <input
              aria-label={`${mark.label} 正解`}
              value={mark.answer}
              onChange={(event) => onUpdate(markIndex, { answer: event.currentTarget.value })}
            />
          </label>
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
            <span>選択肢</span>
            <input
              aria-label={`${mark.label} 選択肢`}
              min={1}
              type="number"
              value={mark.choices}
              onChange={(event) => {
                const choices = positiveInputNumber(event.currentTarget.value);
                onUpdate(markIndex, { choices, optionContents: resizeChoices(mark, choices) });
              }}
            />
          </label>
          <label className="structure-choice-contents">
            <span>マーク内容</span>
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
          <label className="structure-check">
            <input
              aria-label={`${mark.label} 複数回答`}
              checked={mark.multi}
              type="checkbox"
              onChange={(event) => onUpdate(markIndex, { multi: event.currentTarget.checked })}
            />
            <span>複数</span>
          </label>
          <button className="secondary-button" type="button" onClick={() => onRemove(markIndex)}>
            削除
          </button>
          <span className="structure-mark-context">{prefix}</span>
        </div>
      ))}
    </div>
  );
}

function CommonTestPreview({ draft, meta }: { draft: ExamDraft; meta: AuthoringMeta }) {
  const previewSections = draft.sections.slice(0, 2);

  return (
    <div className="common-test-preview">
      <article className="common-test-page cover-preview">
        <div className="cover-warning">試験開始の指示があるまで，この問題冊子の中を見てはいけません。</div>
        <div className="cover-title-line">
          <strong>{meta.title}</strong>
          <span>
            {meta.totalPoints}点
            <br />
            {meta.durationMinutes}分
          </span>
        </div>
        <h3>注意事項</h3>
        <ol>
          <li>解答用紙に正しくマークされていない場合は，採点されないことがあります。</li>
          <li>
            この問題冊子は，解答番号が1から{meta.questionCount}まであり，配点は各問題ごとに明記されています。
          </li>
          <li>解答は，各問題にある所定の記号をクリックまたはタップをしマークしなさい。</li>
        </ol>
        <div className="sample-answer-row" aria-label="解答欄サンプル">
          <span>10</span>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
            <i className={value === 2 || value === 3 || value === 4 ? "filled" : ""} key={value}>
              {value}
            </i>
          ))}
        </div>
      </article>

      <article className="common-test-page problem-preview">
        <div className="page-number">- 1 -</div>
        {previewSections.length ? (
          previewSections.map((section) => (
            <section className="draft-preview-section" key={section.id}>
              <h3>{section.title}</h3>
              {section.body ? <p>{renderMathSegments(section.body)}</p> : null}
              <PreviewMarks marks={section.marks} />
              {section.subsections.map((subsection) => (
                <section className="draft-preview-subsection" key={subsection.id}>
                  <h4>{subsection.title}</h4>
                  {subsection.body ? <p>{renderMathSegments(subsection.body)}</p> : null}
                  <PreviewMarks marks={subsection.marks} />
                </section>
              ))}
            </section>
          ))
        ) : (
          <>
            <h3>第1問</h3>
            <p>フォームから大問，問題文，小問，マークを追加してください。</p>
          </>
        )}
      </article>
    </div>
  );
}

function PreviewMarks({ marks }: { marks: DraftMark[] }) {
  return (
    <>
      {marks.map((mark) => (
        <div className="draft-preview-mark" key={mark.id}>
          <p>
            <span className="latex-mark">{mark.label}</span>
            <span>（配点 {mark.points}）</span>
          </p>
          <div className="choice-preview">
            {normalizeMarkChoices(mark).map((choice) => (
              <button key={choice.value} type="button">
                <i>{choice.value}</i>
                {renderMathSegments(choice.content)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
