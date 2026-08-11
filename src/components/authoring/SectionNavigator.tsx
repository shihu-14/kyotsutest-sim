import type { ExamDraft } from "../../utils/authoring/authoringDraft";

type EditorSelection = "environment" | "section";

interface SectionNavigatorProps {
  draft: ExamDraft;
  sectionTotals: Array<{ marks: number; points: number }>;
  selectedPanel: EditorSelection;
  selectedSectionIndex: number;
  totalMarks: number;
  totalPoints: number;
  onAddSection: () => void;
  onSelectEnvironment: () => void;
  onSelectSection: (sectionIndex: number) => void;
}

export function SectionNavigator({
  draft,
  sectionTotals,
  selectedPanel,
  selectedSectionIndex,
  totalMarks,
  totalPoints,
  onAddSection,
  onSelectEnvironment,
  onSelectSection
}: SectionNavigatorProps) {
  return (
    <aside className="section-nav-pane" aria-label="大問一覧">
      <div className="environment-nav-panel">
        <button
          aria-current={selectedPanel === "environment" ? "page" : undefined}
          className={selectedPanel === "environment" ? "active" : ""}
          type="button"
          onClick={onSelectEnvironment}
        >
          <span>環境設定</span>
          <small>
            {totalMarks}問 / {totalPoints}点
          </small>
        </button>
      </div>
      <div className="section-nav-head">
        <div>
          <h2>大問一覧</h2>
        </div>
        <button className="compact secondary-button" type="button" onClick={onAddSection}>
          追加
        </button>
      </div>
      <div className="section-nav-list">
        {draft.sections.map((section, index) => {
          const totals = sectionTotals[index] ?? { marks: 0, points: 0 };
          return (
            <button
              aria-current={selectedPanel === "section" && index === selectedSectionIndex ? "page" : undefined}
              className={selectedPanel === "section" && index === selectedSectionIndex ? "active" : ""}
              key={section.id}
              type="button"
              onClick={() => onSelectSection(index)}
            >
              <span>{section.title}</span>
              <small>
                {totals.marks}問 / {totals.points}点
              </small>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
