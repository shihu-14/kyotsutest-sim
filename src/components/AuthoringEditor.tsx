import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import { defaultAuthoringSource, parseAuthoringLatex } from "../utils/latex";
import { loadAuthorSource, saveAuthorSource } from "../utils/storage";

interface AuthoringEditorProps {
  onBack: () => void;
}

const snippets = [
  {
    label: "マーク",
    value: String.raw`\mark[answer=0,points=4,choices=4]{ア}`
  },
  {
    label: "選択肢",
    value: String.raw`\choice{ア}{0}{選択肢本文}`
  },
  {
    label: "大問",
    value: String.raw`\sectiontitle{第1問}`
  },
  {
    label: "画像",
    value: String.raw`\includegraphics{https://example.com/figure.png}`
  },
  {
    label: "TikZ",
    value: String.raw`\begin{tikzpicture}\draw (0,0)--(1,0)--(1,1)--cycle;\end{tikzpicture}`
  }
];

export function AuthoringEditor({ onBack }: AuthoringEditorProps) {
  const [source, setSource] = useState(() => loadAuthorSource(defaultAuthoringSource));
  const parsed = useMemo(() => parseAuthoringLatex(source), [source]);

  const updateSource = (nextSource: string | undefined) => {
    const value = nextSource ?? "";
    setSource(value);
    saveAuthorSource(value);
  };

  const insertSnippet = (snippet: string) => {
    updateSource(`${source}\n${snippet}`);
  };

  return (
    <main className="author-layout">
      <header className="exam-toolbar">
        <div>
          <p className="eyebrow">Authoring</p>
          <h1>LaTeX 作問エディタ</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          試験一覧へ戻る
        </button>
      </header>

      <section className="author-grid">
        <div className="editor-pane">
          <div className="snippet-bar" aria-label="テンプレート">
            {snippets.map((snippet) => (
              <button className="secondary-button compact" key={snippet.label} type="button" onClick={() => insertSnippet(snippet.value)}>
                {snippet.label}
              </button>
            ))}
          </div>
          <Editor
            height="62vh"
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
            onChange={updateSource}
          />
        </div>

        <aside className="author-side">
          <section className="preview-pane" aria-label="LaTeXプレビュー">
            <h2>{parsed.title}</h2>
            <div className="latex-preview" dangerouslySetInnerHTML={{ __html: parsed.renderedHtml }} />
          </section>

          <section className="logic-pane" aria-label="自動生成されたマークロジック">
            <h2>マークロジック</h2>
            {parsed.errors.length ? (
              <ul className="error-list">
                {parsed.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : (
              <p className="valid-message">採点ロジックを生成できます。</p>
            )}
            <div className="slot-list">
              {parsed.marks.map((mark) => (
                <article className="slot-row" key={mark.id}>
                  <strong>{mark.label}</strong>
                  <span>{mark.multi ? "複数選択" : "単一選択"}</span>
                  <span>{mark.points}点</span>
                  <span>正解 {mark.answer.join(", ") || "未設定"}</span>
                </article>
              ))}
            </div>
            <details>
              <summary>JSONプレビュー</summary>
              <pre>{parsed.jsonPreview}</pre>
            </details>
          </section>
        </aside>
      </section>
    </main>
  );
}
