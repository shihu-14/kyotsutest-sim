import type { MouseEventHandler, PointerEventHandler } from "react";
import eraserImageUrl from "../../assets/home-tools/eraser.png";
import pencilImageUrl from "../../assets/home-tools/pencil.png";
import type { HomeDrawingToolKind, HomeDrawingToolPhase, Point2D } from "../../utils/homeToolPhysics";

interface HomeDrawingToolsProps {
  onPickTool: (kind: HomeDrawingToolKind, point: Point2D) => void;
  onToolImageLoad: () => void;
  phases: Record<HomeDrawingToolKind, HomeDrawingToolPhase>;
  registerToolElement: (kind: HomeDrawingToolKind, element: HTMLButtonElement | null) => void;
}

export function HomeDrawingTools({
  onPickTool,
  onToolImageLoad,
  phases,
  registerToolElement
}: HomeDrawingToolsProps) {
  const renderTool = (kind: HomeDrawingToolKind, label: string) => {
    const phase = phases[kind];
    const isResting = phase === "resting";
    const onPointerUp: PointerEventHandler<HTMLButtonElement> = (event) => {
      if (isResting && (event.pointerType === "mouse" || event.pointerType === "pen")) {
        onPickTool(kind, { x: event.clientX, y: event.clientY });
      }
    };
    const onClick: MouseEventHandler<HTMLButtonElement> = (event) => {
      if (isResting && event.detail === 0) {
        const bounds = event.currentTarget.getBoundingClientRect();
        onPickTool(kind, { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
      }
    };

    return (
      <button
        aria-label={label}
        aria-pressed={phase === "held" || phase === "contact"}
        className={`home-drawing-tool home-drawing-tool-${kind}`}
        data-home-drawing-tool={kind}
        data-tool-phase={phase}
        disabled={!isResting}
        draggable={false}
        key={kind}
        ref={(element) => registerToolElement(kind, element)}
        type="button"
        onClick={onClick}
        onPointerUp={onPointerUp}
      >
        <img
          alt=""
          className="home-drawing-tool-graphic"
          draggable={false}
          height={kind === "pencil" ? 606 : 230}
          src={kind === "pencil" ? pencilImageUrl : eraserImageUrl}
          width={kind === "pencil" ? 289 : 181}
          onLoad={onToolImageLoad}
        />
      </button>
    );
  };

  return (
    <div aria-label="方眼紙の道具" className="home-drawing-tool-layer" role="group">
      {renderTool("pencil", "鉛筆を拾う")}
      {renderTool("eraser", "消しゴムを拾う")}
    </div>
  );
}
