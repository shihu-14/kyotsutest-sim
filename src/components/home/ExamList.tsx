import { useEffect, useRef } from "react";
import { useHomeDrawingSurface } from "../../hooks/useHomeDrawingSurface";
import type { Exam } from "../../types";
import { HomeDrawingTools } from "./HomeDrawingTools";
import { SteamCapsuleCard } from "./SteamCapsuleCard";

interface ExamListProps {
  exams: Exam[];
  onDelete: (examId: string) => void;
  onEdit: (exam: Exam) => void;
  onSelect: (exam: Exam) => void;
  onOpenEditor: () => void;
}

interface ExamCardActionsProps {
  exam: Exam;
  onDelete: (examId: string) => void;
  onEdit: (exam: Exam) => void;
}

function ExamCardActions({ exam, onDelete, onEdit }: ExamCardActionsProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.removeAttribute("open");
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, []);

  return (
    <details className="exam-actions" ref={detailsRef}>
      <summary aria-label={`${exam.title}の設定`}>⋮</summary>
      <div className="exam-action-menu">
        <button type="button" onClick={() => onEdit(exam)}>
          編集する
        </button>
        <button type="button" onClick={() => onDelete(exam.id)}>
          削除する
        </button>
      </div>
    </details>
  );
}

export function ExamList({ exams, onDelete, onEdit, onSelect, onOpenEditor }: ExamListProps) {
  const authoringDisabled = true;
  const publishedExams = exams.filter((exam) => exam.published);
  const {
    canvasRef,
    pickUpTool,
    pointerHandlers,
    registerToolElement,
    remeasureToolWorld,
    rootRef,
    toolPhases,
  } = useHomeDrawingSurface();

  return (
    <div className="home-pencil-surface" ref={rootRef} {...pointerHandlers}>
      <canvas aria-hidden="true" className="home-pencil-canvas" ref={canvasRef} />
      <main className="screen screen-narrow">
        <header className="screen-heading home-screen-heading">
          <div>
            <h1 className="home-screen-title">共通テスト形式 ウェブ模試</h1>
          </div>
          <div className="home-actions">
            <button
              className="secondary-button authoring-disabled-button"
              disabled={authoringDisabled}
              type="button"
              onClick={authoringDisabled ? undefined : onOpenEditor}
            >
              問題の新規作成
            </button>
          </div>
        </header>
        <section aria-label="公開中の試験一覧" className="exam-grid">
          {publishedExams.map((exam) => (
            <SteamCapsuleCard
              exam={exam}
              key={exam.id}
              onSelect={() => onSelect(exam)}
              settingsControl={
                <ExamCardActions exam={exam} onDelete={onDelete} onEdit={onEdit} />
              }
            />
          ))}
        </section>
      </main>
      <HomeDrawingTools
        onPickTool={pickUpTool}
        onToolImageLoad={remeasureToolWorld}
        phases={toolPhases}
        registerToolElement={registerToolElement}
      />
    </div>
  );
}
