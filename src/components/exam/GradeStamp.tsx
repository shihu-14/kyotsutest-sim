import gradeCircleStamp from "../../assets/stamps/grade-circle.png";
import gradeCrossStamp from "../../assets/stamps/grade-cross.png";

export function GradeStamp({ isCorrect }: { isCorrect: boolean }) {
  const label = isCorrect ? "正解" : "不正解";

  return (
    <span
      aria-label={label}
      className={`grade-stamp stamp-image ${isCorrect ? "circle" : "cross"}`}
    >
      <img alt="" className="stamp-image-source" draggable={false} src={isCorrect ? gradeCircleStamp : gradeCrossStamp} />
    </span>
  );
}
