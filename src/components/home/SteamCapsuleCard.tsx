import type { ReactNode } from "react";
import type { Exam } from "../../types";

interface SteamCapsuleCardProps {
  exam: Exam;
  onSelect: () => void;
  settingsControl: ReactNode;
}

export function SteamCapsuleCard({
  exam,
  onSelect,
  settingsControl
}: SteamCapsuleCardProps) {
  return (
    <article aria-label={exam.title} className="steam-capsule-card">
      <div aria-label={`${exam.title}の表紙`} className="steam-capsule-artwork">
        {exam.coverImageUrl ? (
          <img alt={`${exam.title}の表紙`} draggable={false} src={exam.coverImageUrl} />
        ) : (
          <div
            aria-label={`${exam.title}の表紙画像なし`}
            className="steam-capsule-placeholder"
            role="img"
          >
            <span>{exam.subject}</span>
          </div>
        )}
      </div>
      <button
        aria-label={`${exam.title}を選択`}
        className="steam-capsule-select-button"
        type="button"
        onClick={onSelect}
      />
      <div className="steam-capsule-settings">{settingsControl}</div>
    </article>
  );
}
