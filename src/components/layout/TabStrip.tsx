import { RiCloseLine, RiCodeLine, RiTableLine } from "@remixicon/react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { OpenTab } from "@/types";

interface Props {
  tabs: OpenTab[];
  activeTabId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}

export default function TabStrip({
  tabs,
  activeTabId,
  onActivate,
  onClose,
}: Props) {
  if (tabs.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-border bg-card/60 h-8">
      <ScrollArea className="h-full w-full" type="hover">
        <div className="flex items-end h-full px-1.5 gap-px">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onActivate(tab.id)}
                className={[
                  "flex items-center gap-1.5 px-2.5 h-7 text-[11px] font-medium rounded-t cursor-pointer select-none transition-all group max-w-44 shrink-0",
                  isActive
                    ? "bg-background text-foreground shadow-sm border border-b-0 border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                ].join(" ")}
              >
                {tab.type === "table" ? (
                  <RiTableLine className="size-3 shrink-0 text-primary/70" />
                ) : (
                  <RiCodeLine className="size-3 shrink-0 text-amber-500/70" />
                )}
                <span className="truncate">{tab.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  className={[
                    "shrink-0 rounded p-px ml-0.5 transition-all",
                    isActive
                      ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                      : "opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-foreground hover:bg-accent",
                  ].join(" ")}
                >
                  <RiCloseLine className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
