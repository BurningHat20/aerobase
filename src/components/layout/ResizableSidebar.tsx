import { useCallback, useEffect, useRef, useState } from "react";

const MIN_W = 160; // px
const MAX_W = 480; // px
const DEFAULT_W = 224; // px  ≈ 18% of 1280

interface Props {
  children: React.ReactNode;
}

/**
 * A sidebar that is resizable via a drag handle on its right edge.
 * Uses pointer capture so drag works even if the cursor leaves the element.
 * No external library — immune to react-resizable-panels version issues.
 */
export default function ResizableSidebar({ children }: Props) {
  const [width, setWidth] = useState(DEFAULT_W);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = width;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [width]
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

  // Release capture on any pointer-up anywhere (e.g. fast drag outside window)
  useEffect(() => {
    const release = () => {
      dragging.current = false;
    };
    window.addEventListener("pointerup", release);
    return () => window.removeEventListener("pointerup", release);
  }, []);

  return (
    <div className="relative flex-shrink-0 flex" style={{ width }}>
      {/* Sidebar content */}
      <div className="flex-1 min-w-0 border-r border-border bg-card/50 overflow-hidden">
        {children}
      </div>

      {/* Drag handle — 4px wide hit area, 1px visible */}
      <div
        className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center"
        style={{ width: 8, cursor: "col-resize" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="h-full transition-colors"
          style={{ width: 1, backgroundColor: "transparent" }}
          // Highlight on drag via parent hover
        />
      </div>
    </div>
  );
}
