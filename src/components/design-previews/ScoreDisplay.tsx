import type { CSSProperties, ReactNode } from "react";
import type { GradeSummary } from "../../types";

export const scoreDisplayCandidates = [
  { id: "broadcast", name: "01 Broadcast Score Bug", reference: "中継スコア表示" },
  { id: "margin-grade", name: "02 Exam Margin Grade", reference: "答案余白" },
  { id: "ledger", name: "03 Report Ledger", reference: "成績帳票" },
  { id: "toolbar-tab", name: "04 Toolbar Tab", reference: "見出しタブ" },
  { id: "half-dial", name: "05 Half Dial", reference: "半円ゲージ" },
  { id: "vertical-level", name: "06 Vertical Level", reference: "縦レベル" },
  { id: "lcd", name: "07 LCD Score Window", reference: "計器表示窓" },
  { id: "segments", name: "08 Ten Segment Scale", reference: "10区画目盛" },
  { id: "receipt", name: "09 Receipt Score", reference: "採点結果票" },
  { id: "corner-bracket", name: "10 Corner Bracket", reference: "コーナー括弧" }
] as const;

export type ScoreDisplayVariant = (typeof scoreDisplayCandidates)[number]["id"];

interface ScoreDisplayProps {
  summary: GradeSummary;
  variant: ScoreDisplayVariant;
}

interface ScoreStatusProps {
  children: ReactNode;
  className: string;
  summary: GradeSummary;
  variant: ScoreDisplayVariant;
  style?: CSSProperties;
}

function ScoreStatus({ children, className, summary, variant, style }: ScoreStatusProps) {
  return (
    <div
      aria-label={`得点 ${summary.totalScore}/${summary.totalPoints}`}
      className={`score-display ${className}`}
      data-score-layout={variant}
      role="status"
      style={style}
    >
      {children}
    </div>
  );
}

export function ScoreDisplay({ summary, variant }: ScoreDisplayProps) {
  const ratio = summary.totalPoints > 0 ? summary.totalScore / summary.totalPoints : 0;
  const percentage = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const activeSegments = Math.round(percentage / 10);

  if (variant === "broadcast") {
    return (
      <ScoreStatus className="score-display-broadcast" summary={summary} variant={variant}>
        <span>得点</span>
        <strong>{summary.totalScore}</strong>
        <small>/ {summary.totalPoints}</small>
      </ScoreStatus>
    );
  }

  if (variant === "margin-grade") {
    return (
      <ScoreStatus className="score-display-margin-grade" summary={summary} variant={variant}>
        <small>得点</small>
        <strong>{summary.totalScore}<span>点</span></strong>
        <i aria-hidden="true" />
      </ScoreStatus>
    );
  }

  if (variant === "ledger") {
    return (
      <ScoreStatus className="score-display-ledger" summary={summary} variant={variant}>
        <table>
          <tbody>
            <tr><th scope="row">得点</th><td>{summary.totalScore}</td></tr>
            <tr><th scope="row">満点</th><td>{summary.totalPoints}</td></tr>
          </tbody>
        </table>
      </ScoreStatus>
    );
  }

  if (variant === "toolbar-tab") {
    return (
      <ScoreStatus className="score-display-toolbar-tab" summary={summary} variant={variant}>
        <strong>{summary.totalScore}<span>点</span></strong>
      </ScoreStatus>
    );
  }

  if (variant === "half-dial") {
    return (
      <ScoreStatus className="score-display-half-dial" summary={summary} variant={variant}>
        <svg aria-hidden="true" viewBox="0 0 100 58">
          <path className="score-half-dial-track" d="M8 50 A42 42 0 0 1 92 50" pathLength="100" />
          <path
            className="score-half-dial-value"
            d="M8 50 A42 42 0 0 1 92 50"
            pathLength="100"
            strokeDasharray={`${percentage} ${100 - percentage}`}
          />
        </svg>
        <output><strong>{summary.totalScore}</strong><small>/{summary.totalPoints}</small></output>
      </ScoreStatus>
    );
  }

  if (variant === "vertical-level") {
    const levelStyle = { "--score-level": `${percentage}%` } as CSSProperties;
    return (
      <ScoreStatus className="score-display-vertical-level" summary={summary} style={levelStyle} variant={variant}>
        <span className="score-level-track" aria-hidden="true"><i /></span>
        <div><strong>{summary.totalScore}</strong><small>/{summary.totalPoints}</small></div>
      </ScoreStatus>
    );
  }

  if (variant === "lcd") {
    return (
      <ScoreStatus className="score-display-lcd" summary={summary} variant={variant}>
        <output><strong>{String(summary.totalScore).padStart(3, "0")}</strong><small>/{summary.totalPoints}</small></output>
      </ScoreStatus>
    );
  }

  if (variant === "segments") {
    return (
      <ScoreStatus className="score-display-segments" summary={summary} variant={variant}>
        <div><strong>{summary.totalScore}点</strong><small>/{summary.totalPoints}</small></div>
        <ol aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => <li data-active={index < activeSegments} key={index} />)}
        </ol>
      </ScoreStatus>
    );
  }

  if (variant === "receipt") {
    return (
      <ScoreStatus className="score-display-receipt" summary={summary} variant={variant}>
        <small>得点</small>
        <strong>{summary.totalScore} / {summary.totalPoints}</strong>
        <span aria-hidden="true" />
      </ScoreStatus>
    );
  }

  return (
    <ScoreStatus className="score-display-corner-bracket" summary={summary} variant={variant}>
      <i aria-hidden="true" />
      <span><strong>{summary.totalScore}</strong><small>/{summary.totalPoints}</small></span>
      <i aria-hidden="true" />
    </ScoreStatus>
  );
}
