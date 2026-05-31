import { useState } from "react";
import type { Exam } from "../types";

interface EditorDesignPreviewProps {
  exam: Exam;
}

interface EditorCandidate {
  id: string;
  name: string;
  shortName: string;
  themeClass: string;
  intent: string;
}

const editorCandidates: EditorCandidate[] = [
  {
    id: "overleaf-split",
    name: "01 Overleaf Split",
    shortName: "Overleaf",
    themeClass: "editor-preview-overleaf-split",
    intent: "TeX編集とプレビューを左右で固定する案"
  },
  {
    id: "vscode-workbench",
    name: "02 VS Code Workbench",
    shortName: "Workbench",
    themeClass: "editor-preview-vscode-workbench",
    intent: "ファイルツリー、タブ、本文、検証をまとめる案"
  },
  {
    id: "codepen-panels",
    name: "03 CodePen Panels",
    shortName: "Panels",
    themeClass: "editor-preview-codepen-panels",
    intent: "入力、設定、プレビューを独立パネルで並べる案"
  },
  {
    id: "stackblitz-ide",
    name: "04 StackBlitz IDE",
    shortName: "IDE",
    themeClass: "editor-preview-stackblitz-ide",
    intent: "左ナビと中央エディタを強く分ける案"
  },
  {
    id: "notion-blocks",
    name: "05 Notion Blocks",
    shortName: "Blocks",
    themeClass: "editor-preview-notion-blocks",
    intent: "大問、本文、解答設定をブロックとして扱う案"
  },
  {
    id: "figma-properties",
    name: "06 Figma Properties",
    shortName: "Props",
    themeClass: "editor-preview-figma-properties",
    intent: "中央キャンバスと右プロパティで調整する案"
  },
  {
    id: "spreadsheet-grid",
    name: "07 Spreadsheet Grid",
    shortName: "Grid",
    themeClass: "editor-preview-spreadsheet-grid",
    intent: "設問設定を表で一括編集する案"
  },
  {
    id: "writer-focus",
    name: "08 Writer Focus",
    shortName: "Writer",
    themeClass: "editor-preview-writer-focus",
    intent: "本文入力を主役にして周辺UIを抑える案"
  },
  {
    id: "kanban-author",
    name: "09 Kanban Author",
    shortName: "Kanban",
    themeClass: "editor-preview-kanban-author",
    intent: "大問ごとの作業状態を列で見せる案"
  },
  {
    id: "review-studio",
    name: "10 Review Studio",
    shortName: "Review",
    themeClass: "editor-preview-review-studio",
    intent: "TeX差分、プレビュー、検証ログを同時に見る案"
  }
];

const sections = ["環境設定", "大問1", "大問2", "大問3"];

export function EditorDesignPreview({ exam }: EditorDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(editorCandidates[0].id);
  const activeCandidate =
    editorCandidates.find((candidate) => candidate.id === activeCandidateId) ?? editorCandidates[0];
  const firstQuestion = exam.questions[0];

  return (
    <section className="exam-design-mode editor-design-mode" aria-label="編集画面デザイン候補">
      <header className="design-mode-heading">
        <div>
          <p className="eyebrow">Editor candidates</p>
          <h2>編集画面デザイン候補</h2>
        </div>
        <div className="design-reference-pill">Authoring workspace</div>
      </header>

      <div className="design-candidate-tabs" role="tablist" aria-label="編集画面デザイン候補">
        {editorCandidates.map((candidate) => (
          <button
            aria-selected={candidate.id === activeCandidate.id}
            className="design-candidate-tab"
            key={candidate.id}
            role="tab"
            type="button"
            onClick={() => setActiveCandidateId(candidate.id)}
          >
            <span>{candidate.name}</span>
            <small>{candidate.shortName}</small>
          </button>
        ))}
      </div>

      <article className="editor-design-canvas" aria-label={`${activeCandidate.name}のプレビュー`}>
        <header className="timer-candidate-header">
          <div>
            <p>{activeCandidate.intent}</p>
            <h3>{activeCandidate.name}</h3>
          </div>
          <span>{exam.questions.length}問</span>
        </header>

        <div className={`editor-preview ${activeCandidate.themeClass}`}>
          <header className="editor-preview-topbar">
            <strong>{exam.title}</strong>
            <nav aria-label="編集操作サンプル">
              <button type="button">詳細TeX</button>
              <button type="button">Preview</button>
              <button type="button">公開</button>
            </nav>
          </header>

          <div className="editor-preview-body">
            <aside className="editor-preview-nav">
              {sections.map((section, index) => (
                <button className={index === 1 ? "active" : ""} key={section} type="button">
                  {section}
                </button>
              ))}
            </aside>

            <section className="editor-preview-code" aria-label="TeX編集サンプル">
              <div className="editor-preview-tabs">
                <span>大問TeX</span>
                <span>解答設定</span>
              </div>
              <pre>{`% === 大問本文: 第1問 ===
\\section{第1問}
${firstQuestion?.prompt ?? "本文を入力"}

% --- 解答番号 ${firstQuestion?.label ?? "1"} ---
\\mark[answer=${firstQuestion?.correct[0] ?? "1"},points=${firstQuestion?.points ?? 5},choices=${
                firstQuestion?.options.length ?? 4
              }]{${firstQuestion?.label ?? "1"}}`}</pre>
            </section>

            <section className="editor-preview-inspector" aria-label="設定サンプル">
              <div>
                <span>設問数</span>
                <strong>{exam.questions.length}</strong>
              </div>
              <div>
                <span>制限時間</span>
                <strong>{exam.durationMinutes}分</strong>
              </div>
              <div>
                <span>配点</span>
                <strong>{exam.totalPoints}点</strong>
              </div>
            </section>

            <section className="editor-preview-paper" aria-label="プレビューサンプル">
              <strong>第 1 問</strong>
              <p />
              <p />
              <div />
            </section>
          </div>
        </div>
      </article>
    </section>
  );
}
