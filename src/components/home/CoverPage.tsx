import { useEffect, useRef, useState } from "react";
import type { AnswerValue, Exam } from "../../types";
import { CoverImageMarks } from "../exam/CoverImageMarks";

interface CoverPageProps {
  exam: Exam;
  onBack: () => void;
  onStart: () => void;
}

export function CoverPage({ exam, onBack, onStart }: CoverPageProps) {
  const [coverMarks, setCoverMarks] = useState<Set<AnswerValue>>(() => new Set());
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setCoverMarks(new Set());
  }, [exam.id]);

  useEffect(() => {
    const root = rootRef.current;
    const preventWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };
    const preventKeyboardZoom = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        ["+", "=", "-", "_", "0"].includes(event.key)
      ) {
        event.preventDefault();
      }
    };

    root?.addEventListener("wheel", preventWheelZoom, { passive: false });
    window.addEventListener("keydown", preventKeyboardZoom);
    return () => {
      root?.removeEventListener("wheel", preventWheelZoom);
      window.removeEventListener("keydown", preventKeyboardZoom);
    };
  }, []);

  const toggleCoverMark = (value: AnswerValue) => {
    setCoverMarks((current) => (current.has(value) ? new Set() : new Set([value])));
  };

  return (
    <main className="exam-mode-background prestart-page" ref={rootRef}>
      <div className="prestart-content">
        <section className="prestart-cover-stage" aria-label="試験開始前の表紙">
          <article className="prestart-cover-document" aria-label={`${exam.title}の表紙`}>
            {exam.coverImageUrl ? (
              <>
                <img
                  className="exact-page-image"
                  src={exam.coverImageUrl}
                  alt={`${exam.title}の表紙`}
                  draggable={false}
                />
                {exam.coverMarkAreas?.length ? (
                  <CoverImageMarks
                    areas={exam.coverMarkAreas}
                    selectedValues={coverMarks}
                    onToggle={toggleCoverMark}
                  />
                ) : null}
              </>
            ) : (
              <div className="prestart-cover-placeholder" role="img" aria-label="表紙画像なし" />
            )}

            <nav className="prestart-actions" aria-label="試験開始前の操作">
              <button
                className="secondary-button home-return-button prestart-home-return-button"
                type="button"
                onClick={onBack}
              >
                ホームに戻る
              </button>
              <button className="prestart-button" type="button" onClick={onStart}>
                試験を始める
              </button>
            </nav>
          </article>
        </section>
      </div>
    </main>
  );
}
