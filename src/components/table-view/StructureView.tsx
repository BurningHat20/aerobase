import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiAlertLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ColumnInfo } from "@/types";

// ── Key type badge ─────────────────────────────────────────────────────────────
function KeyBadge({ k }: { k: string }) {
  if (!k) return null;
  const map: Record<string, string> = {
    PRI: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    UNI: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    MUL: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
  };
  return (
    <span
      className={`inline-flex items-center h-5 px-1.5 rounded text-[10px] font-bold border font-mono tracking-wide ${
        map[k] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {k}
    </span>
  );
}

// ── Type colour ────────────────────────────────────────────────────────────────
function TypeLabel({ type }: { type: string }) {
  const base = type.toUpperCase().split("(")[0];
  let cls = "text-sky-600 dark:text-sky-400";
  if (
    [
      "INT",
      "BIGINT",
      "SMALLINT",
      "TINYINT",
      "MEDIUMINT",
      "FLOAT",
      "DOUBLE",
      "DECIMAL",
    ].includes(base)
  )
    cls = "text-emerald-600 dark:text-emerald-400";
  else if (["DATE", "DATETIME", "TIMESTAMP", "TIME", "YEAR"].includes(base))
    cls = "text-violet-600 dark:text-violet-400";
  else if (["ENUM", "SET"].includes(base))
    cls = "text-amber-600 dark:text-amber-400";
  return (
    <span className={`font-mono text-[11px] font-medium ${cls}`}>{type}</span>
  );
}

interface Props {
  db: string;
  table: string;
}

const HEADERS = [
  "#",
  "Field",
  "Type",
  "Null",
  "Key",
  "Default",
  "Extra",
  "Comment",
];

export default function StructureView({ db, table }: Props) {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setColumns([]);
    invoke<ColumnInfo[]>("get_table_structure", {
      dbName: db,
      tableName: table,
    })
      .then(setColumns)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [db, table]);

  if (loading)
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-full"
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="flex items-start gap-2 m-4 p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
        <RiAlertLine className="size-3.5 shrink-0 mt-px" />
        {error}
      </div>
    );

  return (
    <ScrollArea className="h-full">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-card">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap border-r border-border/30 last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr
              key={col.field}
              className={`border-b border-border/30 transition-colors hover:bg-accent/30 ${
                i % 2 === 0 ? "" : "bg-muted/20"
              }`}
            >
              <td className="px-3 py-2 text-muted-foreground/35 font-mono text-[10px] border-r border-border/20 w-8 tabular-nums">
                {i + 1}
              </td>
              <td className="px-3 py-2 border-r border-border/20">
                <span className="font-mono font-semibold text-foreground text-[11px]">
                  {col.field}
                </span>
              </td>
              <td className="px-3 py-2 border-r border-border/20">
                <TypeLabel type={col.type_name} />
              </td>
              <td className="px-3 py-2 border-r border-border/20">
                {col.nullable ? (
                  <Badge
                    variant="secondary"
                    className="h-5 text-[10px] px-1.5 font-normal"
                  >
                    YES
                  </Badge>
                ) : (
                  <span className="text-muted-foreground/40 text-[11px]">
                    NO
                  </span>
                )}
              </td>
              <td className="px-3 py-2 border-r border-border/20">
                <KeyBadge k={col.key_type} />
              </td>
              <td className="px-3 py-2 border-r border-border/20 font-mono text-[11px] text-muted-foreground">
                {col.default_val === null ? (
                  <span className="text-muted-foreground/25 italic">NULL</span>
                ) : (
                  col.default_val || (
                    <span className="text-muted-foreground/25 italic">—</span>
                  )
                )}
              </td>
              <td className="px-3 py-2 border-r border-border/20 text-[11px] text-muted-foreground/60">
                {col.extra || (
                  <span className="text-muted-foreground/20">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-[11px] text-muted-foreground/50">
                {col.comment || (
                  <span className="text-muted-foreground/20">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
