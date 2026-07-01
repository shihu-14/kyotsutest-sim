import type { CSSProperties } from "react";
import type { AnswerValue, CoverMarkArea } from "../../types";

interface CoverImageMarksProps {
  areas: CoverMarkArea[];
  selectedValues: Set<AnswerValue>;
  onToggle: (value: AnswerValue) => void;
}

export function CoverImageMarks({ areas, selectedValues, onToggle }: CoverImageMarksProps) {
  return (
    <div className="page-image-mark-layer" aria-label="表紙のマーク欄">
      {areas.map((area) => {
        const style = {
          "--mark-x": `${area.xPercent}%`,
          "--mark-y": `${area.yPercent}%`,
          "--mark-width": `${area.widthPercent ?? 3.2}%`,
          "--mark-height": `${area.heightPercent ?? 2.6}%`
        } as CSSProperties;

        return (
          <button
            aria-label={`表紙 ${area.label} ${area.value}`}
            aria-pressed={selectedValues.has(area.value)}
            className={["page-image-mark", selectedValues.has(area.value) ? "selected" : ""].filter(Boolean).join(" ")}
            key={area.id}
            style={style}
            type="button"
            onClick={() => onToggle(area.value)}
          />
        );
      })}
    </div>
  );
}
