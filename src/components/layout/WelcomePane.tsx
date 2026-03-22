import {
  RiCodeLine,
  RiDatabase2Line,
  RiKeyboardLine,
  RiTableLine,
} from "@remixicon/react";

interface Hint {
  icon: React.ReactNode;
  label: string;
  keys: string;
}

const HINTS: Hint[] = [
  {
    icon: <RiTableLine className="size-3.5 text-primary/70" />,
    label: "Browse a table",
    keys: "Click any table in the sidebar",
  },
  {
    icon: <RiCodeLine className="size-3.5 text-amber-500/70" />,
    label: "Run SQL",
    keys: 'Click "SQL Editor" in the top bar',
  },
  {
    icon: <RiKeyboardLine className="size-3.5 text-sky-400/70" />,
    label: "Execute query",
    keys: "Ctrl + Enter",
  },
];

interface Props {
  dbCount: number;
}

export default function WelcomePane({ dbCount }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-center px-8 select-none">
      {/* Icon */}
      <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center">
        <RiDatabase2Line className="size-6 text-muted-foreground/25" />
      </div>

      {/* Copy */}
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-sm font-semibold text-foreground">
          Ready to explore
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {dbCount} database{dbCount !== 1 ? "s" : ""} connected. Open a table
          or write a query to get started.
        </p>
      </div>

      {/* Hints */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {HINTS.map((h) => (
          <div
            key={h.label}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border/50 text-left"
          >
            {h.icon}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground leading-tight">
                {h.label}
              </p>
              <p className="text-[10px] text-muted-foreground">{h.keys}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
