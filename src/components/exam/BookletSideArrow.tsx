interface BookletSideArrowProps {
  direction: "previous" | "next";
  onClick: () => void;
}

export function BookletSideArrow({ direction, onClick }: BookletSideArrowProps) {
  return (
    <button
      aria-label={direction === "previous" ? "前のページへ" : "次のページへ"}
      className={`booklet-side-arrow ${direction}`}
      type="button"
      onClick={onClick}
    >
      {direction === "previous" ? "‹" : "›"}
    </button>
  );
}
