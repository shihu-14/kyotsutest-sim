import { useState } from "react";
import type { Exam } from "../../types";

interface EditorDesignPreviewProps {
  exam: Exam;
}

type PreviewQuestion = Exam["questions"][number];

type EditorLayout =
  | "overleaf"
  | "workbench"
  | "codepen"
  | "stackblitz"
  | "blocks"
  | "properties"
  | "spreadsheet"
  | "writer"
  | "kanban"
  | "review";

interface EditorCandidate {
  id: string;
  name: string;
  shortName: string;
  themeClass: string;
  intent: string;
  layout: EditorLayout;
}

const editorCandidates: EditorCandidate[] = [
  {
    id: "overleaf-split",
    name: "01 Overleaf Split",
    shortName: "Overleaf",
    themeClass: "editor-preview-overleaf-split",
    intent: "TeX編集とPDFプレビューを左右で固定する案",
    layout: "overleaf"
  },
  {
    id: "vscode-workbench",
    name: "02 VS Code Workbench",
    shortName: "Workbench",
    themeClass: "editor-preview-vscode-workbench",
    intent: "ファイル、タブ、コード、問題ログを統合する案",
    layout: "workbench"
  },
  {
    id: "codepen-panels",
    name: "03 CodePen Panels",
    shortName: "Panels",
    themeClass: "editor-preview-codepen-panels",
    intent: "大問TeX、解答設定、環境TeX、プレビューを四分割する案",
    layout: "codepen"
  },
  {
    id: "stackblitz-ide",
    name: "04 StackBlitz IDE",
    shortName: "IDE",
    themeClass: "editor-preview-stackblitz-ide",
    intent: "左のツリーと中央作業領域、右の実行プレビューを分ける案",
    layout: "stackblitz"
  },
  {
    id: "notion-blocks",
    name: "05 Notion Blocks",
    shortName: "Blocks",
    themeClass: "editor-preview-notion-blocks",
    intent: "大問や解答番号をブロックとして積み上げる案",
    layout: "blocks"
  },
  {
    id: "figma-properties",
    name: "06 Figma Properties",
    shortName: "Props",
    themeClass: "editor-preview-figma-properties",
    intent: "中央キャンバスと右プロパティで編集する案",
    layout: "properties"
  },
  {
    id: "spreadsheet-grid",
    name: "07 Spreadsheet Grid",
    shortName: "Grid",
    themeClass: "editor-preview-spreadsheet-grid",
    intent: "設問、正解、配点を表で一括管理する案",
    layout: "spreadsheet"
  },
  {
    id: "writer-focus",
    name: "08 Writer Focus",
    shortName: "Writer",
    themeClass: "editor-preview-writer-focus",
    intent: "本文入力を主役にしてTeXを補助表示にする案",
    layout: "writer"
  },
  {
    id: "kanban-author",
    name: "09 Kanban Author",
    shortName: "Kanban",
    themeClass: "editor-preview-kanban-author",
    intent: "大問単位の進行状態をボードで管理する案",
    layout: "kanban"
  },
  {
    id: "review-studio",
    name: "10 Review Studio",
    shortName: "Review",
    themeClass: "editor-preview-review-studio",
    intent: "差分、プレビュー、検証ログをレビュー向けに並べる案",
    layout: "review"
  }
];

const sections = ["環境設定", "大問1", "大問2", "大問3"];

function previewQuestion(exam: Exam) {
  return exam.questions[0];
}

function previewAnswer(question?: PreviewQuestion) {
  return question?.correct.join("|") || "-";
}

function previewChoiceCount(question?: PreviewQuestion) {
  return question?.options.length ?? 0;
}

function previewPoints(question?: PreviewQuestion) {
  return question?.points ?? 0;
}

function codeLines(exam: Exam) {
  const question = previewQuestion(exam);

  return [
    "% === 大問本文: 第1問 ===",
    "\\section{第1問}",
    "式が表すアニメの名称として最も適当なものを選べ。",
    "",
    `% --- 解答番号 ${question?.label ?? "1"} ---`,
    `\\mark[answer=${previewAnswer(question)},points=${previewPoints(question)},choices=${previewChoiceCount(question)}]{${question?.label ?? "1"}}`
  ];
}

function CodePane({ exam, title = "大問TeX" }: { exam: Exam; title?: string }) {
  return (
    <section className="editor-code-pane">
      <header>{title}</header>
      <pre>{codeLines(exam).join("\n")}</pre>
    </section>
  );
}

function PaperPane() {
  return (
    <section className="editor-paper-pane">
      <strong>第 1 問</strong>
      <p />
      <p />
      <div />
    </section>
  );
}

function Inspector({ exam }: { exam: Exam }) {
  return (
    <aside className="editor-inspector-pane">
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
    </aside>
  );
}

function SectionNav() {
  return (
    <aside className="editor-section-nav">
      {sections.map((section, index) => (
        <button className={index === 1 ? "active" : ""} key={section} type="button">
          {section}
        </button>
      ))}
    </aside>
  );
}

function renderEditorLayout(layout: EditorLayout, exam: Exam) {
  if (layout === "overleaf") {
    return (
      <div className="editor-layout-overleaf">
        <SectionNav />
        <CodePane exam={exam} />
        <PaperPane />
      </div>
    );
  }

  if (layout === "workbench") {
    return (
      <div className="editor-layout-workbench">
        <SectionNav />
        <main>
          <div className="editor-tab-row">
            <span>section-1.tex</span>
            <span>answers.json</span>
          </div>
          <CodePane exam={exam} title="section-1.tex" />
          <div className="editor-terminal">問題数 OK / 解答番号 OK / 画像参照 OK</div>
        </main>
      </div>
    );
  }

  if (layout === "codepen") {
    return (
      <div className="editor-layout-codepen">
        <CodePane exam={exam} title="大問TeX" />
        <CodePane exam={exam} title="解答設定" />
        <CodePane exam={exam} title="環境TeX" />
        <PaperPane />
      </div>
    );
  }

  if (layout === "stackblitz") {
    return (
      <div className="editor-layout-stackblitz">
        <SectionNav />
        <CodePane exam={exam} />
        <PaperPane />
        <div className="editor-terminal">Compiled in 112ms</div>
      </div>
    );
  }

  if (layout === "blocks") {
    const question = previewQuestion(exam);

    return (
      <div className="editor-layout-blocks">
        <article>
          <h3>第1問</h3>
          <div className="editor-block">本文ブロック</div>
          <div className="editor-block">
            解答番号 {question?.label ?? "1"} / 正解 {previewAnswer(question)} / {previewPoints(question)}点
          </div>
          <div className="editor-block">画像ブロック</div>
        </article>
        <Inspector exam={exam} />
      </div>
    );
  }

  if (layout === "properties") {
    return (
      <div className="editor-layout-properties">
        <SectionNav />
        <PaperPane />
        <Inspector exam={exam} />
      </div>
    );
  }

  if (layout === "spreadsheet") {
    return (
      <div className="editor-layout-spreadsheet">
        <div className="editor-sheet-grid">
          <span>解答番号</span>
          <span>正解</span>
          <span>配点</span>
          <span>選択肢</span>
          {exam.questions.slice(0, 4).map((question) => (
            <div className="editor-sheet-row" key={question.id}>
              <strong>{question.label}</strong>
              <span>{previewAnswer(question)}</span>
              <span>{question.points}</span>
              <span>{question.options.length}</span>
            </div>
          ))}
        </div>
        <PaperPane />
      </div>
    );
  }

  if (layout === "writer") {
    const question = previewQuestion(exam);

    return (
      <div className="editor-layout-writer">
        <SectionNav />
        <article>
          <h3>第1問</h3>
          <p>式が表すアニメの名称として最も適当なものを選べ。</p>
          <p className="editor-inline-mark">
            解答番号 {question?.label ?? "1"} / 正解 {previewAnswer(question)} / 配点 {previewPoints(question)}
          </p>
        </article>
      </div>
    );
  }

  if (layout === "kanban") {
    return (
      <div className="editor-layout-kanban">
        {["下書き", "TeX確認", "Preview確認", "公開準備"].map((column, index) => (
          <section key={column}>
            <h3>{column}</h3>
            <div>大問{Math.min(index + 1, 3)}</div>
            <div>解答設定</div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="editor-layout-review">
      <CodePane exam={exam} title="変更前" />
      <CodePane exam={exam} title="変更後" />
      <PaperPane />
      <div className="editor-terminal">差分 3件 / 警告 0件 / 公開可能</div>
    </div>
  );
}

export function EditorDesignPreview({ exam }: EditorDesignPreviewProps) {
  const [activeCandidateId, setActiveCandidateId] = useState(editorCandidates[0].id);
  const activeCandidate =
    editorCandidates.find((candidate) => candidate.id === activeCandidateId) ?? editorCandidates[0];

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
          {renderEditorLayout(activeCandidate.layout, exam)}
        </div>
      </article>
    </section>
  );
}
