import type { ReactNode } from "react";
import type { Exam } from "../../types";

export const steamCapsuleThemes = [
  { id: "current", name: "01 Current Baseline", shortName: "基準" },
  { id: "exam-crimson", name: "02 Exam Crimson", shortName: "深紅" },
  { id: "midnight-blue", name: "03 Midnight Blue", shortName: "濃紺" },
  { id: "forest-gold", name: "04 Forest Gold", shortName: "深緑" },
  { id: "sepia-paper", name: "05 Sepia Paper", shortName: "焦茶" },
  { id: "cobalt-orange", name: "06 Cobalt Orange", shortName: "青橙" },
  { id: "monochrome-ink", name: "07 Monochrome Ink", shortName: "墨色" },
  { id: "teal-coral", name: "08 Teal Coral", shortName: "青緑" },
  { id: "plum-amber", name: "09 Plum Amber", shortName: "プラム" },
  { id: "slate-lime", name: "10 Slate Lime", shortName: "スレート" }
] as const;

export type SteamCapsuleThemeId = (typeof steamCapsuleThemes)[number]["id"];

interface SteamCapsuleCardProps {
  exam: Exam;
  settingsControl: ReactNode;
  startControl: ReactNode;
  theme?: SteamCapsuleThemeId;
}

export function SteamCapsuleCard({
  exam,
  settingsControl,
  startControl,
  theme = "current"
}: SteamCapsuleCardProps) {
  return (
    <article
      className={`steam-capsule-card capsule-theme-${theme}`}
      data-card-structure="steam-capsule"
      data-capsule-theme={theme}
    >
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
      <div aria-hidden="true" className="steam-capsule-overlay" />
      <div className="steam-capsule-settings">{settingsControl}</div>
      <div className="steam-capsule-content">
        <div className="steam-capsule-kicker">
          <span>共通テスト形式</span>
          <span>公開中</span>
        </div>
        <h2 title={exam.title}>{exam.title}</h2>
        <dl className="steam-capsule-metrics">
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
        <div className="steam-capsule-start">{startControl}</div>
      </div>
    </article>
  );
}
