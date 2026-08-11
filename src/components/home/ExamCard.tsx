import type { ReactNode } from "react";
import type { Exam } from "../../types";

interface ExamCardProps {
  exam: Exam;
  onSelect: () => void;
  settingsControl: ReactNode;
}

export function ExamCard({
  exam,
  onSelect,
  settingsControl
}: ExamCardProps) {
  return (
    <article aria-label={exam.title} className="exam-card">
      <div aria-label={`${exam.title}の表紙`} className="exam-card-cover">
        {exam.coverImageUrl ? (
          <img alt={`${exam.title}の表紙`} draggable={false} src={exam.coverImageUrl} />
        ) : (
          <div
            aria-label={`${exam.title}の表紙画像なし`}
            className="exam-card-cover-placeholder"
            role="img"
          >
            <span>{exam.subject}</span>
          </div>
        )}
      </div>
      <button
        aria-label={`${exam.title}を選択`}
        className="exam-card-select"
        type="button"
        onClick={onSelect}
      />
      <div className="exam-card-settings">{settingsControl}</div>
    </article>
  );
}
