import { useRef } from "react";

/** Draggable divider. Reports the pointer delta (px) along its axis while dragging. */
export function Gutter({
  orientation,
  onResize,
}: {
  orientation: "vertical" | "horizontal";
  onResize: (deltaPx: number) => void;
}) {
  const dragging = useRef(false);
  const vertical = orientation === "vertical"; // divider stands vertically, resizes width

  return (
    <div
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (dragging.current) onResize(vertical ? e.movementX : e.movementY);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      className={`group relative z-10 flex shrink-0 items-center justify-center ${
        vertical ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"
      }`}
      style={{ touchAction: "none" }}
    >
      {/* visible handle pill, grows on hover */}
      <div
        className="rounded-full transition-all group-hover:bg-white/30"
        style={
          vertical
            ? { width: 3, height: 28, background: "var(--border-strong)" }
            : { height: 3, width: 28, background: "var(--border-strong)" }
        }
      />
    </div>
  );
}
