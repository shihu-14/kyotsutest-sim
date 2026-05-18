import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import type { AuthoringMeta, Exam, QuestionSlot } from "../types";
import { defaultAuthoringMeta, defaultAuthoringSource, parseAuthoringLatex } from "../utils/latex";
import { loadAuthorMeta, loadAuthorSource, saveAuthorMeta, saveAuthorSource } from "../utils/storage";

interface AuthoringEditorProps {
  initialExam?: Exam | null;
  onBack: () => void;
  onPublish: (exam: Exam) => void;
}

type TextMetaKey = "title" | "subject" | "description";
type NumberMetaKey = "questionCount" | "totalPoints" | "durationMinutes";

interface EditableMark {
  index: number;
  label: string;
  answer: string;
  points: number;
  choices: number;
  multi: boolean;
}

const textFields: Array<{ key: TextMetaKey; label: string; multiline?: boolean }> = [
  { key: "title", label: "タイトル" },
  { key: "subject", label: "科目名" },
  { key: "description", label: "説明", multiline: true }
];

function parseMarkAttrs(input: string | undefined): Record<string, string> {
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

function serializeMarkAttrs(attrs: Record<string, string>): string {
  const orderedKeys = ["answer", "points", "choices", "multi"];
  const extras = Object.keys(attrs).filter((key) => !orderedKeys.includes(key));
  return [...orderedKeys, ...extras]
    .filter((key) => attrs[key] !== undefined && attrs[key] !== "")
    .map((key) => `${key}=${attrs[key]}`)
    .join(",");
}

function getEditableMarks(source: string): EditableMark[] {
  const marks: EditableMark[] = [];
  const pattern = /\\mark(?:\[([^\]]*)\])?\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const attrs = parseMarkAttrs(match[1]);
    const answer = attrs.answer ?? "";
    const points = Number(attrs.points ?? 0);
    const choices = Number(attrs.choices ?? 4);

    marks.push({
      index: marks.length,
      label: match[2],
      answer,
      points: Number.isFinite(points) ? points : 0,
      choices: Number.isInteger(choices) && choices > 0 ? choices : 4,
      multi: attrs.multi === "true" || answer.includes("|")
    });
  }

  return marks;
}

function updateMarkCommand(source: string, targetIndex: number, updates: Partial<EditableMark>): string {
  let currentIndex = 0;
  return source.replace(/\\mark(?:\[([^\]]*)\])?\{([^}]*)\}/g, (full, attrsRaw: string, label: string) => {
    const isTarget = currentIndex === targetIndex;
    currentIndex += 1;
    if (!isTarget) {
      return full;
    }

    const attrs = parseMarkAttrs(attrsRaw);
    if (updates.answer !== undefined) {
      attrs.answer = updates.answer;
    }
    if (updates.points !== undefined) {
      attrs.points = String(Math.max(0, updates.points));
    }
    if (updates.choices !== undefined) {
      attrs.choices = String(Math.max(1, updates.choices));
    }
    if (updates.multi !== undefined) {
      if (updates.multi) {
        attrs.multi = "true";
      } else {
        delete attrs.multi;
      }
    }

    return `\\mark[${serializeMarkAttrs(attrs)}]{${label}}`;
  });
}

function appendDefaultMarkDefinitions(source: string, meta: AuthoringMeta): string {
  if (getEditableMarks(source).length > 0) {
    return source;
  }

  const questionCount = Math.max(1, meta.questionCount);
  const basePoints = Math.floor(meta.totalPoints / questionCount);
  const remainder = meta.totalPoints % questionCount;
  const markLines = Array.from({ length: questionCount }, (_item, index) => {
    const label = String(index + 1);
    const points = basePoints + (index < remainder ? 1 : 0);
    return `\\mark[answer=1,points=${points},choices=4]{${label}}`;
  });

  return `${source.trimEnd()}\n\n% Answer mark definitions\n${markLines.join("\n")}\n`;
}

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

function sourceFromExam(exam: Exam | null | undefined): string {
  if (!exam) {
    return loadAuthorSource(defaultAuthoringSource);
  }

  const markLines = exam.questions.map(
    (question) =>
      `\\mark[answer=${question.correct.join("|")},points=${question.points},choices=${question.options.length}${
        question.multi ? ",multi=true" : ""
      }]{${question.label}} % ${question.section}`
  );

  return [
    `% ${exam.title}`,
    `% 既存試験を編集しています。メタ情報は設定から変更できます。`,
    "\\documentclass{article}",
    "\\begin{document}",
    `\\section*{${exam.title}}`,
    exam.description,
    "",
    "% 解答欄定義",
    ...markLines,
    "\\end{document}"
  ].join("\n");
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

function buildPublishedExam(meta: AuthoringMeta, source: string, initialExam: Exam | null | undefined): Exam {
  const parsed = parseAuthoringLatex(source);
  const markSections = getMarkSections(source);

  if (initialExam) {
    const questions = parsed.marks.length
      ? initialExam.questions.map<QuestionSlot>((question, index) => {
          const mark = parsed.marks[index];
          if (!mark) {
            return question;
          }

          return {
            ...question,
            label: mark.label,
            points: mark.points,
            multi: mark.multi,
            options: Array.from({ length: mark.choices }, (_item, optionIndex) => {
              const value = String(optionIndex + 1);
              return (
                question.options.find((option) => option.label === value || option.value === value) ?? {
                  value,
                  label: value,
                  content: value
                }
              );
            }),
            correct: mark.answer
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
  const questions = parsed.marks.length
    ? parsed.marks.map<QuestionSlot>((mark, index) => ({
        id: `draft-q${String(index + 1).padStart(2, "0")}`,
        label: mark.label,
        section: markSections[index] ?? `第${index + 1}問`,
        prompt: "作成したTeXコードに対応する解答欄です。",
        pageId: "draft-p1",
        points: mark.points,
        multi: mark.multi,
        options: Array.from({ length: mark.choices }, (_item, optionIndex) => {
          const value = String(optionIndex + 1);
          return { value, label: value, content: value };
        }),
        correct: mark.answer,
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
        blocks: [
          { type: "heading", text: meta.title, level: 2 },
          { type: "paragraph", text: source.slice(0, 240) || "投稿されたTeXコードから作成した問題です。" },
          ...questions.map((question) => ({ type: "question" as const, questionId: question.id }))
        ]
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
  const validationErrors = useMemo(() => validateAuthoring(source, meta), [source, meta]);
  const editableMarks = useMemo(() => getEditableMarks(source), [source]);
  const sourceStats = useMemo(() => {
    const parsed = parseAuthoringLatex(source);
    return {
      lines: source.split("\n").length,
      marks: parsed.marks.length,
      answerSlots: source.match(/\\counterbox/g)?.length ?? 0
    };
  }, [source]);
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

  const updateMark = (index: number, updates: Partial<EditableMark>) => {
    setSource((currentSource) => updateMarkCommand(currentSource, index, updates));
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
            <h2>TeXコード</h2>
            <span>{sourceStats.lines} lines</span>
          </div>
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
        </div>

        <aside className="author-side">
          <section className="preview-pane" aria-label="共通テスト形式プレビュー">
            <div className="preview-heading">
              <h2>プレビュー</h2>
              <span>解答欄 {sourceStats.answerSlots || sourceStats.marks}</span>
            </div>
            <CommonTestPreview meta={meta} />
            <AnswerMarkSettings
              marks={editableMarks}
              onCreate={() => setSource((currentSource) => appendDefaultMarkDefinitions(currentSource, meta))}
              onUpdate={updateMark}
            />
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
          <section className="confirm-dialog settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title">
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

interface AnswerMarkSettingsProps {
  marks: EditableMark[];
  onCreate: () => void;
  onUpdate: (index: number, updates: Partial<EditableMark>) => void;
}

function AnswerMarkSettings({ marks, onCreate, onUpdate }: AnswerMarkSettingsProps) {
  return (
    <section className="answer-settings" aria-label="解答マーク設定">
      <div className="answer-settings-heading">
        <h2>解答マーク設定</h2>
        {!marks.length ? (
          <button className="secondary-button" type="button" onClick={onCreate}>
            解答欄を作成
          </button>
        ) : null}
      </div>
      {marks.length ? (
        <div className="answer-settings-list">
          {marks.map((mark) => (
            <div className="answer-setting-row" key={`${mark.index}-${mark.label}`}>
              <strong>{mark.label}</strong>
              <label>
                <span>正解</span>
                <input
                  aria-label={`${mark.label} 正解`}
                  value={mark.answer}
                  onChange={(event) => onUpdate(mark.index, { answer: event.currentTarget.value })}
                />
              </label>
              <label>
                <span>配点</span>
                <input
                  aria-label={`${mark.label} 配点`}
                  min={0}
                  type="number"
                  value={mark.points}
                  onChange={(event) => onUpdate(mark.index, { points: Number(event.currentTarget.value) })}
                />
              </label>
              <label>
                <span>選択肢</span>
                <input
                  aria-label={`${mark.label} 選択肢`}
                  min={1}
                  type="number"
                  value={mark.choices}
                  onChange={(event) => onUpdate(mark.index, { choices: Number(event.currentTarget.value) })}
                />
              </label>
              <label className="answer-setting-check">
                <input
                  aria-label={`${mark.label} 複数回答`}
                  checked={mark.multi}
                  type="checkbox"
                  onChange={(event) => onUpdate(mark.index, { multi: event.currentTarget.checked })}
                />
                <span>複数</span>
              </label>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CommonTestPreview({ meta }: { meta: AuthoringMeta }) {
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
        <h3>第１問</h3>
        <p>
          以下の連立方程式において，各式 1 から 3 がそれぞれ画像 I から III に示されたアニメの名称の一部を表している。
        </p>
        <div className="equation-preview">
          <span>y - x_n = ci</span>
          <span>fg'' = c</span>
          <span>pb × abq° = _d t</span>
        </div>
        <div className="choice-preview">
          {["おねがい☆ティーチャー", "オーバーロード", "オッドタクシー", "【推しの子】"].map((choice, index) => (
            <button key={choice} type="button">
              <i>{index + 1}</i>
              {choice}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
