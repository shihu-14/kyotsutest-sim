import type { MouseEventHandler, PointerEventHandler } from "react";
import type { HomeDrawingToolKind, HomeDrawingToolPhase, Point2D } from "../../utils/homeToolPhysics";

interface HomeDrawingToolsProps {
  onPickTool: (kind: HomeDrawingToolKind, point: Point2D) => void;
  phases: Record<HomeDrawingToolKind, HomeDrawingToolPhase>;
  registerToolElement: (kind: HomeDrawingToolKind, element: HTMLButtonElement | null) => void;
}

function PencilGraphic() {
  return (
    <svg aria-hidden="true" className="home-drawing-tool-graphic" viewBox="0 0 145 24">
      <defs>
        <linearGradient id="home-pencil-paint" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2c45c" />
          <stop offset="0.52" stopColor="#dba23e" />
          <stop offset="1" stopColor="#b87624" />
        </linearGradient>
      </defs>
      <path d="M3 4h119l21 8-21 8H3z" fill="url(#home-pencil-paint)" stroke="#76522b" strokeWidth="1" />
      <path d="m122 4 21 8-21 8 7-8z" fill="#dfbb83" stroke="#76522b" strokeWidth="1" />
      <path d="m143 12-8-3v6z" fill="#424846" />
      <path d="M3 4h12v16H3z" fill="#d87578" stroke="#76522b" strokeWidth="1" />
      <path d="M15 4h9v16h-9z" fill="#c8b58d" stroke="#7c6c4f" strokeWidth="1" />
      <path d="M28 8h94" fill="none" stroke="rgba(255,255,255,.48)" strokeWidth="1.2" />
      <path d="M28 17h94" fill="none" stroke="rgba(93,55,18,.22)" strokeWidth="1" />
    </svg>
  );
}

function EraserGraphic() {
  return (
    <svg aria-hidden="true" className="home-drawing-tool-graphic" viewBox="0 0 68 38">
      <defs>
        <linearGradient id="home-eraser-rubber" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2a7a2" />
          <stop offset="1" stopColor="#c96f72" />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="64" height="32" rx="7" fill="url(#home-eraser-rubber)" stroke="#815c5a" />
      <path d="M26 3h26v32H26z" fill="#e7ded0" stroke="#928574" />
      <path d="M30 9h18M30 14h14" stroke="#b8ab98" strokeWidth="1.2" />
      <path d="M7 9h15" stroke="rgba(255,255,255,.45)" strokeWidth="1.4" />
    </svg>
  );
}

export function HomeDrawingTools({ onPickTool, phases, registerToolElement }: HomeDrawingToolsProps) {
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
        {kind === "pencil" ? <PencilGraphic /> : <EraserGraphic />}
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
