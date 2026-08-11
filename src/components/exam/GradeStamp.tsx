import { useId } from "react";
import gradeCircleStamp from "../../assets/stamps/grade-circle.png";
import gradeCrossStamp from "../../assets/stamps/grade-cross.png";

interface GradeStampProps {
  animate?: boolean;
  isCorrect: boolean;
}

export function GradeStamp({ animate = false, isCorrect }: GradeStampProps) {
  const label = isCorrect ? "正解" : "不正解";
  const maskId = `grade-stamp-${useId().replaceAll(":", "")}`;
  const image = isCorrect ? gradeCircleStamp : gradeCrossStamp;
  const width = isCorrect ? 450 : 970;
  const height = isCorrect ? 332 : 1074;

  return (
    <span
      aria-label={label}
      className={["grade-stamp", "red-pen", isCorrect ? "circle" : "cross", animate ? "is-drawing" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        aria-hidden="true"
        className="stamp-drawing"
        focusable="false"
        viewBox={`0 0 ${width} ${height}`}
      >
        {animate ? (
          <defs>
            <mask height={height} id={maskId} maskUnits="userSpaceOnUse" width={width} x="0" y="0">
              {isCorrect ? (
                <path
                  className="stamp-reveal-stroke circle-reveal-stroke"
                  d="M218 280 C126 273 59 218 64 158 C70 80 140 31 226 34 C326 30 398 77 397 153 C397 199 374 232 340 254 C310 275 275 287 246 294"
                  pathLength="1"
                />
              ) : (
                <>
                  <path
                    className="stamp-reveal-stroke cross-reveal-stroke first"
                    d="M135 78 L905 826"
                    pathLength="1"
                  />
                  <path
                    className="stamp-reveal-stroke cross-reveal-stroke second"
                    d="M902 44 L60 1040"
                    pathLength="1"
                  />
                </>
              )}
            </mask>
          </defs>
        ) : null}
        <image
          className="stamp-asset"
          height={height}
          href={image}
          mask={animate ? `url(#${maskId})` : undefined}
          width={width}
        />
      </svg>
    </span>
  );
}
