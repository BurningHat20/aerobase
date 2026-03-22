import {
  RiCodeLine,
  RiCommandLine,
  RiDatabase2Line,
  RiTableLine,
} from "@remixicon/react";

interface Shortcut {
  icon: React.ReactNode;
  action: string;
  how: string;
  keys?: string[];
}

const SHORTCUTS: Shortcut[] = [
  {
    icon: <RiTableLine className="size-4 text-primary" />,
    action: "Browse table",
    how: "Click any table in the sidebar",
  },
  {
    icon: <RiCodeLine className="size-4 text-amber-500" />,
    action: "SQL Editor",
    how: "Click SQL Editor or press",
    keys: ["Ctrl", "T"],
  },
  {
    icon: <RiCommandLine className="size-4 text-sky-500" />,
    action: "Run query",
    how: "Inside the editor, press",
    keys: ["Ctrl", "↵"],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 text-[10px] font-mono font-medium rounded border border-border bg-muted text-muted-foreground">
      {children}
    </span>
  );
}

export default function WelcomePane({ dbCount }: { dbCount: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 select-none p-8">
      {/* Icon */}
      <div className="flex flex-col items-center gap-3">
        <div className="size-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
          <RiDatabase2Line className="size-7 text-muted-foreground/25" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            {dbCount} database{dbCount !== 1 ? "s" : ""} ready
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a table or open the SQL editor to get started
          </p>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="w-full max-w-xs space-y-2">
        {SHORTCUTS.map((s) => (
          <div
            key={s.action}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card border border-border"
          >
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground leading-tight">
                {s.action}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                {s.how}
                {s.keys?.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
