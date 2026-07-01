import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import type { Exam, ExamPage, UserAnswers } from "../../types";
import { ProblemBooklet } from "../exam/ProblemBooklet";

const previewAnswers: UserAnswers = {};
const ignorePreviewAnswer = () => undefined;

interface EnvironmentTexEditorProps {
  source: string;
  onChange: (source: string) => void;
}

export function EnvironmentTexEditor({ source, onChange }: EnvironmentTexEditorProps) {
  return (
    <div className="section-tex-editor">
      <div className="tex-runtime-strip" aria-label="TeX共通設定">
        <span>試験設定・preview環境・表紙注意事項をまとめて編集</span>
        <code>{Math.ceil(source.length / 1024)}KB unit</code>
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

export function PublishedSectionPreview({ exam, page }: { exam: Exam; page: ExamPage }) {
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

export function SectionTexEditor({ compileSize, source, onChange }: SectionTexEditorProps) {
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
