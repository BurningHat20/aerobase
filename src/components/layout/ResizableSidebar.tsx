import { useCallback, useEffect, useRef, useState } from "react";

const MIN_W = 180;
const MAX_W = 420;
const DEFAULT_W = 240;
const COLLAPSED_W = 0;

interface Props {
  children: React.ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ResizableSidebar({ children, collapsed, onToggleCollapse }: Props) {
  const [width, setWidth] = useState(DEFAULT_W);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const prevWidth = useRef(DEFAULT_W);

  // Snap to collapsed/expanded
  useEffect(() => {
    if (collapsed) {
      prevWidth.current = width || DEFAULT_W;
    } else if (width === 0) {
      setWidth(prevWidth.current || DEFAULT_W);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  const displayWidth = collapsed ? COLLAPSED_W : width;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (collapsed) return;
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = width;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [width, collapsed]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    const next = Math.min(MAX_W, Math.max(MIN_W, startW.current + delta));
    setWidth(next);
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Double-click to toggle collapse
  const onDoubleClick = useCallback(() => {
    onToggleCollapse();
  }, [onToggleCollapse]);

  useEffect(() => {
    const release = () => { dragging.current = false; };
    window.addEventListener("pointerup", release);
    return () => window.removeEventListener("pointerup", release);
  }, []);

  return (
    <div
      className="relative flex-shrink-0 flex transition-[width] duration-200 ease-out"
      style={{ width: displayWidth }}
    >
      {/* Sidebar content */}
      <div className={`flex-1 min-w-0 overflow-hidden border-r border-border ${collapsed ? "invisible" : ""}`}>
        {children}
      </div>

      {/* Drag handle */}
      <div
        className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center group"
        style={{ width: 8, cursor: collapsed ? "e-resize" : "col-resize", transform: "translateX(4px)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="h-full w-[2px] rounded-full transition-colors bg-transparent group-hover:bg-primary/40 group-active:bg-primary" />
      </div>
    </div>
  );
}
