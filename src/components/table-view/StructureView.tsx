import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiAlertLine } from "@remixicon/react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ColumnInfo } from "@/types";

// Inline key badge — avoids shadcn Badge class conflicts
function KeyBadge({ k }: { k: string }) {
  if (!k) return null;
  const styles: Record<string, string> = {
    PRI: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    UNI: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    MUL: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold border tracking-wide ${
        styles[k] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {k}
    </span>
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

  if (loading) {
    return (
      <div className="p-4 space-y-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 m-4 p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
        <RiAlertLine className="size-3.5 shrink-0 mt-px" />
        {error}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-card/90 backdrop-blur-sm">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold text-foreground/60 whitespace-nowrap border-r border-border/30 last:border-r-0"
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
              className="border-b border-border/30 hover:bg-accent/40 transition-colors"
            >
              <td className="px-3 py-2 text-muted-foreground/35 font-mono text-[10px] border-r border-border/20 w-8">
                {i + 1}
              </td>
              <td className="px-3 py-2 font-mono font-semibold text-foreground border-r border-border/20">
                {col.field}
              </td>
              <td className="px-3 py-2 font-mono text-sky-400/80 border-r border-border/20">
                {col.type_name}
              </td>
              <td className="px-3 py-2 border-r border-border/20">
                <span
                  className={
                    col.nullable
                      ? "text-muted-foreground"
                      : "text-foreground/50"
                  }
                >
                  {col.nullable ? "YES" : "NO"}
                </span>
              </td>
              <td className="px-3 py-2 border-r border-border/20">
                <KeyBadge k={col.key_type} />
              </td>
              <td className="px-3 py-2 font-mono border-r border-border/20 text-muted-foreground">
                {col.default_val ?? (
                  <span className="text-muted-foreground/25 italic">NULL</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground/60 border-r border-border/20">
                {col.extra}
              </td>
              <td className="px-3 py-2 text-muted-foreground/50">
                {col.comment}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
