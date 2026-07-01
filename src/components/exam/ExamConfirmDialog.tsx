import type { CSSProperties } from "react";

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

export function ExamConfirmDialog({
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
