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

function sourceFromExam(exam: Exam | null | undefined): string {
  if (!exam) {
    return loadAuthorSource(defaultAuthoringSource);
  }

  return [
    `% ${exam.title}`,
    `% 既存試験を編集しています。メタ情報は設定から変更できます。`,
    "\\documentclass{article}",
    "\\begin{document}",
    `\\section*{${exam.title}}`,
    exam.description,
    "\\end{document}"
  ].join("\n");
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
  if (initialExam) {
    return {
      ...initialExam,
      title: meta.title,
      subject: meta.subject,
      description: meta.description,
      durationMinutes: meta.durationMinutes,
      totalPoints: meta.totalPoints,
      published: true
    };
  }

  const questionCount = Math.max(1, meta.questionCount);
  const questions = Array.from({ length: questionCount }, (_item, index) =>
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
  const [publishState, setPublishState] = useState<"idle" | "published">("idle");
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
            この問題冊子は，問題が第1問から第{meta.questionCount}問まであり，配点は各問題ごとに明記されています。
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
