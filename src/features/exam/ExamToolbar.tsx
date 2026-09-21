import { useState, type CSSProperties } from "react";
import type { GradeSummary } from "../../domain/exam";
import { ExamTimer } from "./StopwatchTimer";

interface ExamToolbarProps {
  reviewMode: boolean;
  reviewSummary: GradeSummary | null;
  deadline: number | null;
  durationMinutes: number;
  onExpire: () => void;
  onFinish: () => void;
  onExitReview?: () => void;
  onReturnHome?: () => void;
}
const timerAccentColor = "#ff4d00";
const homeActionColor = "#fffaf1";

export function ExamToolbar({
  reviewMode,
  reviewSummary,
  deadline,
  durationMinutes,
  onExpire,
  onFinish,
  onExitReview,
  onReturnHome
}: ExamToolbarProps) {
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const finishColorStyle = {
    "--finish-color": timerAccentColor,
    backgroundColor: timerAccentColor,
    color: "#ffffff"
  } as CSSProperties;
  const homeColorStyle = {
    "--home-action-color": homeActionColor,
    backgroundColor: homeActionColor
  } as CSSProperties;
  const exitDialogStyle = {
    width: "min(550px, calc(100vw - 40px))"
  } as CSSProperties;
  const exitDialogCopyStyle = {
    whiteSpace: "nowrap"
  } as CSSProperties;
  const exitDialogActionsStyle = {
    gap: "16px"
  } as CSSProperties;

  return (
    <>
      <header className="exam-toolbar" aria-label="試験操作">
        <div className="toolbar-metrics">
          {reviewMode && reviewSummary ? <ReviewScoreBadge summary={reviewSummary} /> : null}
          {!reviewMode ? (
            <ExamTimer deadline={deadline} totalMs={durationMinutes * 60 * 1000} onExpire={onExpire} />
          ) : null}
          {reviewMode ? (
            <button
              className="secondary-button home-return-button"
              style={homeColorStyle}
              type="button"
              onClick={onExitReview}
            >
              ホームに戻る
            </button>
          ) : (
            <div className="finish-action-stack">
              {onReturnHome ? (
                <button
                  className="secondary-button home-return-button"
                  style={homeColorStyle}
                  type="button"
                  onClick={() => setShowHomeConfirm(true)}
                >
                  ホームに戻る
                </button>
              ) : null}
              <button
                className="danger-button finish-button"
                style={finishColorStyle}
                type="button"
                onClick={() => setShowFinishConfirm(true)}
              >
                採点へ進む
              </button>
            </div>
          )}
        </div>
      </header>

      {showFinishConfirm ? (
        <ExamConfirmDialog
          actionsStyle={exitDialogActionsStyle}
          ariaLabel="採点へ進む確認"
          confirmStyle={finishColorStyle}
          confirmText="採点へ進む"
          copy="残り時間がありますが，解答を終了し採点へ進みますか"
          copyStyle={exitDialogCopyStyle}
          dialogStyle={exitDialogStyle}
          onCancel={() => setShowFinishConfirm(false)}
          onConfirm={() => {
            setShowFinishConfirm(false);
            onFinish();
          }}
        />
      ) : null}
      {showHomeConfirm ? (
        <ExamConfirmDialog
          actionsStyle={exitDialogActionsStyle}
          ariaLabel="ホームに戻る確認"
          confirmStyle={finishColorStyle}
          confirmText="ホームに戻る"
          copy="試験を中断してホームへ戻りますか（現在の解答は保存されません）"
          copyStyle={exitDialogCopyStyle}
          dialogStyle={exitDialogStyle}
          onCancel={() => setShowHomeConfirm(false)}
          onConfirm={() => {
            setShowHomeConfirm(false);
            onReturnHome?.();
          }}
        />
      ) : null}
    </>
  );
}

interface ReviewScoreBadgeProps {
  summary: GradeSummary;
}

function ReviewScoreBadge({ summary }: ReviewScoreBadgeProps) {
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

interface ExamConfirmDialogProps {
  ariaLabel: string;
  copy: string;
  confirmText: string;
  confirmStyle: CSSProperties;
  dialogStyle: CSSProperties;
  copyStyle: CSSProperties;
  actionsStyle: CSSProperties;
  onCancel: () => void;
  onConfirm: () => void;
}

function ExamConfirmDialog({
  ariaLabel,
  copy,
  confirmText,
  confirmStyle,
  dialogStyle,
  copyStyle,
  actionsStyle,
  onCancel,
  onConfirm
}: ExamConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <p style={copyStyle}>{copy}</p>
        <div className="dialog-actions" style={actionsStyle}>
          <button className="secondary-button" type="button" onClick={onCancel}>
            解答を続ける
          </button>
          <button className="danger-button finish-button" style={confirmStyle} type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
