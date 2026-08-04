import { useState } from "react";
import { useHomePencilDrawing } from "../../hooks/useHomePencilDrawing";
import type { Exam } from "../../types";
import { EditorDesignPreview } from "../design-previews/EditorDesignPreview";
import { ExamDesignPreview } from "../design-previews/ExamDesignPreview";
import { HomeDesignPreview } from "../design-previews/HomeDesignPreview";
import { PageNavDesignPreview } from "../design-previews/PageNavDesignPreview";
import { ScoringDesignPreview } from "../design-previews/ScoringDesignPreview";
import { TimerDesignPreview } from "../design-previews/TimerDesignPreview";
import { HomeDrawingTools } from "./HomeDrawingTools";

interface ExamListProps {
  exams: Exam[];
  onDelete: (examId: string) => void;
  onEdit: (exam: Exam) => void;
  onSelect: (exam: Exam) => void;
  onOpenEditor: () => void;
}

export function ExamList({ exams, onDelete, onEdit, onSelect, onOpenEditor }: ExamListProps) {
  const [homeMode, setHomeMode] = useState<
    "exams" | "designs" | "timers" | "pageNavs" | "homes" | "editors" | "scorings"
  >("exams");
  const authoringDisabled = true;
  const previewExam = exams.find((exam) => exam.pages.some((page) => page.pageImageUrl)) ?? exams[0];
  const {
    canvasRef,
    clearDrawing,
    hasDrawing,
    pickUpTool,
    pointerHandlers,
    registerToolElement,
    rootRef,
    toolPhases,
  } = useHomePencilDrawing();

  return (
    <div className="home-pencil-surface" ref={rootRef} {...pointerHandlers}>
      <canvas aria-hidden="true" className="home-pencil-canvas" ref={canvasRef} />
      <main className="screen screen-narrow">
        <header className="screen-heading">
          <div>
            <h1>共通テスト形式 ウェブ模試</h1>
          </div>
          <div className="home-actions">
            <button
              className="text-button home-pencil-clear"
              disabled={!hasDrawing}
              type="button"
              onClick={clearDrawing}
            >
              書き込みを消す
            </button>
            {homeMode !== "exams" ? (
              <button className="secondary-button" type="button" onClick={() => setHomeMode("exams")}>
                試験一覧
              </button>
            ) : null}
            <button
              aria-pressed={homeMode === "designs"}
              className="secondary-button"
              type="button"
              onClick={() => setHomeMode("designs")}
            >
              画面候補
            </button>
            <button
              aria-pressed={homeMode === "homes"}
              className="secondary-button"
              type="button"
              onClick={() => setHomeMode("homes")}
            >
              ホーム候補
            </button>
            <button
              aria-pressed={homeMode === "timers"}
              className="secondary-button"
              type="button"
              onClick={() => setHomeMode("timers")}
            >
              時間候補
            </button>
            <button
              aria-pressed={homeMode === "pageNavs"}
              className="secondary-button"
              type="button"
              onClick={() => setHomeMode("pageNavs")}
            >
              ページ候補
            </button>
            <button
              aria-pressed={homeMode === "scorings"}
              className="secondary-button"
              type="button"
              onClick={() => setHomeMode("scorings")}
            >
              採点候補
            </button>
            <button
              aria-pressed={homeMode === "editors"}
              className="secondary-button"
              type="button"
              onClick={() => setHomeMode("editors")}
            >
              編集候補
            </button>
            <button
              className="secondary-button authoring-disabled-button"
              disabled={authoringDisabled}
              type="button"
              onClick={authoringDisabled ? undefined : onOpenEditor}
            >
              新規作成
            </button>
          </div>
        </header>

        {homeMode === "designs" && previewExam ? (
          <ExamDesignPreview exam={previewExam} />
        ) : homeMode === "homes" ? (
          <HomeDesignPreview exams={exams.filter((exam) => exam.published)} />
        ) : homeMode === "timers" && previewExam ? (
          <TimerDesignPreview exam={previewExam} />
        ) : homeMode === "pageNavs" && previewExam ? (
          <PageNavDesignPreview exam={previewExam} />
        ) : homeMode === "scorings" && previewExam ? (
          <ScoringDesignPreview exam={previewExam} />
        ) : homeMode === "editors" && previewExam ? (
          <EditorDesignPreview exam={previewExam} />
        ) : (
          <section className="exam-grid" aria-label="公開中の試験一覧">
            {exams
              .filter((exam) => exam.published)
              .map((exam) => (
                <article className="exam-tile" key={exam.id}>
                  <div className="exam-card-main">
                    <div className="exam-card-copy">
                      <div className="exam-title-row">
                        <div>
                          <h2>{exam.title}</h2>
                        </div>
                        <details className="exam-actions">
                          <summary aria-label={`${exam.title}の設定`}>⋮</summary>
                          <div className="exam-action-menu">
                            <button
                              className="authoring-disabled-button"
                              disabled={authoringDisabled}
                              type="button"
                              onClick={authoringDisabled ? undefined : () => onEdit(exam)}
                            >
                              編集する
                            </button>
                            <button type="button" onClick={() => onDelete(exam.id)}>
                              削除する
                            </button>
                          </div>
                        </details>
                      </div>
                      <dl className="exam-meta">
                        <div>
                          <dt>時間</dt>
                          <dd>{exam.durationMinutes}分</dd>
                        </div>
                        <div>
                          <dt>設問</dt>
                          <dd>{exam.questions.length}問</dd>
                        </div>
                        <div>
                          <dt>配点</dt>
                          <dd>{exam.totalPoints}点</dd>
                        </div>
                      </dl>
                      <button className="primary-button" type="button" onClick={() => onSelect(exam)}>
                        試験を始める
                      </button>
                    </div>
                    <div className="exam-cover-thumb" aria-label={`${exam.title}の表紙`}>
                      {exam.coverImageUrl ? (
                        <img src={exam.coverImageUrl} alt="" draggable={false} />
                      ) : (
                        <div className="cover-placeholder" />
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </section>
        )}
      </main>
      <HomeDrawingTools
        onPickTool={pickUpTool}
        phases={toolPhases}
        registerToolElement={registerToolElement}
      />
    </div>
  );
}
