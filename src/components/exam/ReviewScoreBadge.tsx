import type { GradeSummary } from "../../types";

interface ReviewScoreBadgeProps {
  summary: GradeSummary;
}

export function ReviewScoreBadge({ summary }: ReviewScoreBadgeProps) {
  return (
    <div className="review-score-badge" role="status" aria-label={`得点 ${summary.totalScore}/${summary.totalPoints}`}>
      <span>得点</span>
      <strong>
        {summary.totalScore}
        <small>/{summary.totalPoints}</small>
      </strong>
    </div>
  );
}
