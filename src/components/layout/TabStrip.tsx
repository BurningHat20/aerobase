import { RiCloseLine, RiCodeLine, RiTableLine } from "@remixicon/react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { OpenTab } from "@/types";

interface Props {
  tabs: OpenTab[];
  activeTabId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}

/**
 * Browser-style tab strip.
 *
 * Visual contract:
 * - The strip itself has bg-muted/30 + a bottom border.
 * - Active tab: bg-background, has left/top/right border, bottom border is
 *   REMOVED via negative margin-bottom + z-index — the tab appears "open"
 *   and connected to the content below it.
 * - Inactive tabs: no background, no border, subtle hover.
 */
export default function TabStrip({
  tabs,
  activeTabId,
  onActivate,
  onClose,
}: Props) {
  if (tabs.length === 0) return null;

  return (
    /* The -mb-px trick: push the strip's bottom border behind the active tab */
    <div className="shrink-0 border-b border-border bg-muted/20">
      <ScrollArea className="w-full" type="hover">
        <div className="flex items-end h-9 px-3 gap-0.5">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            const isTable = tab.type === "table";

            return (
              <button
                key={tab.id}
                onClick={() => onActivate(tab.id)}
                className={[
                  // shared
                  "relative flex items-center gap-1.5 px-3 h-8 text-xs font-medium",
                  "rounded-t-lg transition-all select-none shrink-0 max-w-48 group",
                  // active: sits on top of the border line below
                  active
                    ? "bg-background text-foreground border border-border border-b-background z-10 -mb-px shadow-none"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                ].join(" ")}
              >
                {/* Tab icon */}
                {isTable ? (
                  <RiTableLine
                    className={`size-3 shrink-0 transition-colors ${
                      active
                        ? "text-primary"
                        : "text-muted-foreground/50 group-hover:text-muted-foreground"
                    }`}
                  />
                ) : (
                  <RiCodeLine
                    className={`size-3 shrink-0 transition-colors ${
                      active
                        ? "text-amber-500"
                        : "text-muted-foreground/50 group-hover:text-muted-foreground"
                    }`}
                  />
                )}

                {/* Label */}
                <span className="truncate leading-none">{tab.label}</span>

                {/* Close */}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onClose(tab.id)}
                  className={[
                    "shrink-0 size-4 flex items-center justify-center rounded transition-all ml-0.5",
                    "hover:bg-destructive/15 hover:text-destructive",
                    active
                      ? "text-muted-foreground/60"
                      : "opacity-0 group-hover:opacity-100 text-muted-foreground/40",
                  ].join(" ")}
                >
                  <RiCloseLine className="size-3" />
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
}
