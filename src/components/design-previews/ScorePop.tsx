import { useEffect, useState, type CSSProperties } from "react";

export const scorePopCandidates = [
  { id: "google-forms", name: "01 Google Forms Plain", reference: "簡素な結果パネル" },
  { id: "kahoot-focus", name: "02 Kahoot Score Focus", reference: "数字を主役にした表示" },
  { id: "apple-gauge", name: "03 Apple Gauge", reference: "細い円形ゲージ" },
  { id: "live-activity", name: "04 Live Activity Capsule", reference: "コンパクトなカプセル" },
  { id: "achievement-toast", name: "05 Steam Achievement Toast", reference: "採点通知トースト" },
  { id: "fluent-result", name: "06 Fluent Result", reference: "静かなProgressRing" },
  { id: "broadcast", name: "07 Broadcast Score Bug", reference: "中継スコア表示" },
  { id: "red-stamp", name: "08 Exam Red Stamp", reference: "答案への採点印" },
  { id: "score-slip", name: "09 Score Slip", reference: "小さな採点結果票" },
  { id: "number-reveal", name: "10 Number Reveal", reference: "数字だけの基準案" }
] as const;

export type ScorePopVariant = (typeof scorePopCandidates)[number]["id"];

interface ScorePopProps {
  score: number;
  totalPoints: number;
  variant: ScorePopVariant;
}

function CountUpScore({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion || typeof window.requestAnimationFrame !== "function") {
      setDisplayScore(score);
      return undefined;
    }

    let animationFrameId: number | null = null;
    let startTime: number | null = null;
    setDisplayScore(0);

    const update = (timestamp: number) => {
      startTime ??= timestamp;
      const progress = Math.min(1, (timestamp - startTime) / 460);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * easedProgress));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(update);
      }
    };

    animationFrameId = window.requestAnimationFrame(update);
    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [score]);

  return <>{displayScore}</>;
}

export function ScorePop({ score, totalPoints, variant }: ScorePopProps) {
  const percentage = totalPoints > 0 ? Math.max(0, Math.min(100, (score / totalPoints) * 100)) : 0;
  const progressStyle = {
    "--score-pop-progress": `${percentage}%`,
    "--score-pop-dash-offset": 100 - percentage
  } as CSSProperties;
  const commonProps = {
    "aria-label": `得点 ${score}/${totalPoints}`,
    "data-score-pop-layout": variant,
    role: "status"
  } as const;

  switch (variant) {
    case "google-forms":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-google-forms">
          <small>得点</small>
          <strong>{score} / {totalPoints}</strong>
        </div>
      );
    case "kahoot-focus":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-kahoot-focus">
          <strong>{score}<span>点</span></strong>
          <small>/{totalPoints}</small>
        </div>
      );
    case "apple-gauge":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-apple-gauge" style={progressStyle}>
          <svg aria-hidden="true" viewBox="0 0 72 72">
            <circle className="score-pop-ring-track" cx="36" cy="36" r="29" pathLength="100" />
            <circle className="score-pop-ring-value" cx="36" cy="36" r="29" pathLength="100" />
          </svg>
          <output>
            <strong>{score}</strong>
            <small>/{totalPoints}</small>
          </output>
        </div>
      );
    case "live-activity":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-live-activity" style={progressStyle}>
          <span>得点</span>
          <strong>{score}<small> / {totalPoints}</small></strong>
          <i aria-hidden="true" />
        </div>
      );
    case "achievement-toast":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-achievement-toast">
          <span aria-hidden="true">○</span>
          <div>
            <small>採点完了</small>
            <strong>{score}点</strong>
          </div>
        </div>
      );
    case "fluent-result":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-fluent-result" style={progressStyle}>
          <svg aria-hidden="true" viewBox="0 0 36 36">
            <circle className="score-pop-ring-track" cx="18" cy="18" r="14" pathLength="100" />
            <circle className="score-pop-ring-value" cx="18" cy="18" r="14" pathLength="100" />
          </svg>
          <div>
            <span>得点</span>
            <strong>{score}</strong>
            <small>/ {totalPoints}</small>
          </div>
        </div>
      );
    case "broadcast":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-broadcast">
          <span>SCORE</span>
          <div>
            <strong>{score}</strong>
            <small>/{totalPoints}</small>
          </div>
        </div>
      );
    case "red-stamp":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-red-stamp">
          <span>得点</span>
          <strong>{score}点</strong>
        </div>
      );
    case "score-slip":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-score-slip">
          <small>得点</small>
          <i aria-hidden="true" />
          <strong>{score}<span>/ {totalPoints}</span></strong>
        </div>
      );
    case "number-reveal":
      return (
        <div {...commonProps} className="score-pop-candidate score-pop-number-reveal">
          <strong><CountUpScore score={score} /></strong>
          <small>/{totalPoints}点</small>
        </div>
      );
  }
}
