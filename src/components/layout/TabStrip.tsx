import { RiAddLine, RiCloseLine, RiCodeLine, RiTableLine } from "@remixicon/react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { OpenTab } from "@/types";

interface Props {
  tabs: OpenTab[];
  activeTabId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNewQuery?: () => void;
}

export default function TabStrip({
  tabs,
  activeTabId,
  onActivate,
  onClose,
  onNewQuery,
}: Props) {
  if (tabs.length === 0) return null;

  return (
    <div className="shrink-0 bg-card/50 border-b border-border">
      <ScrollArea className="w-full" type="hover">
        <div className="flex items-center h-10 px-2 gap-1">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            const isTable = tab.type === "table";

            return (
              <button
                key={tab.id}
                onClick={() => onActivate(tab.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    onClose(tab.id);
                  }
                }}
                className={[
                  "relative flex items-center gap-2 px-3 h-8 text-xs font-medium",
                  "rounded-md transition-colors select-none shrink-0 max-w-48 group",
                  active
                    ? "bg-background text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                ].join(" ")}
              >
                {isTable ? (
                  <RiTableLine
                    className={`size-3.5 shrink-0 ${
                      active ? "text-foreground" : "text-muted-foreground/40"
                    }`}
                  />
                ) : (
                  <RiCodeLine
                    className={`size-3.5 shrink-0 ${
                      active ? "text-foreground" : "text-muted-foreground/40"
                    }`}
                  />
                )}

                <span className="truncate leading-none">{tab.label}</span>

                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onClose(tab.id)}
                  className={[
                    "shrink-0 size-5 flex items-center justify-center rounded-sm transition-all ml-0.5",
                    "hover:bg-foreground/10",
                    active
                      ? "text-muted-foreground"
                      : "opacity-0 group-hover:opacity-100 text-muted-foreground/40",
                  ].join(" ")}
                >
                  <RiCloseLine className="size-3.5" />
                </span>
              </button>
            );
          })}

          {onNewQuery && (
            <button
              onClick={onNewQuery}
              className="shrink-0 size-8 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-muted-foreground hover:bg-accent/50 transition-colors"
              title="New SQL Editor (Ctrl+T)"
            >
              <RiAddLine className="size-4" />
            </button>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
}
