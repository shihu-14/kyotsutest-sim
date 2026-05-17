import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import type { AuthoringMeta } from "../types";
import { defaultAuthoringMeta, defaultAuthoringSource, parseAuthoringLatex } from "../utils/latex";
import { loadAuthorMeta, loadAuthorSource, saveAuthorMeta, saveAuthorSource } from "../utils/storage";

interface AuthoringEditorProps {
  onBack: () => void;
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

export function AuthoringEditor({ onBack }: AuthoringEditorProps) {
  const [source, setSource] = useState(() => loadAuthorSource(defaultAuthoringSource));
  const [meta, setMeta] = useState(() => loadAuthorMeta(defaultAuthoringMeta));
  const [savedSource, setSavedSource] = useState(source);
  const [savedMeta, setSavedMeta] = useState(meta);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
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
          <span className={`save-state ${isDirty ? "dirty" : ""}`}>{isDirty ? "未保存" : "保存済み"}</span>
          <button className="primary-button" type="button" onClick={saveDraft}>
            一時保存
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
          <section className="meta-pane" aria-label="試験メタ情報">
            <h2>メタ情報</h2>
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
          </section>

          <section className="preview-pane" aria-label="共通テスト形式プレビュー">
            <div className="preview-heading">
              <h2>プレビュー</h2>
              <span>解答欄 {sourceStats.answerSlots || sourceStats.marks}</span>
            </div>
            <CommonTestPreview meta={meta} />
          </section>
        </aside>
      </section>

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
