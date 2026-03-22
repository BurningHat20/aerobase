import { useCallback, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCodeLine,
  RiDatabase2Line,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiServerLine,
  RiTableLine,
} from "@remixicon/react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConnectionInfo } from "@/types";

interface DbNode {
  tables: string[];
  expanded: boolean;
  loading: boolean;
  loaded: boolean;
}

interface Props {
  connectionInfo: ConnectionInfo;
  databases: string[];
  onOpenTable: (db: string, table: string) => void;
  onOpenQuery: (db: string) => void;
}

export default function Sidebar({
  connectionInfo,
  databases,
  onOpenTable,
  onOpenQuery,
}: Props) {
  const [search, setSearch] = useState("");
  const [nodes, setNodes] = useState<Record<string, DbNode>>(() =>
    Object.fromEntries(
      databases.map((db) => [
        db,
        { tables: [], expanded: false, loading: false, loaded: false },
      ])
    )
  );

  const toggleDb = useCallback(
    async (db: string) => {
      const node = nodes[db];
      if (!node) return;

      // Collapse
      if (node.expanded) {
        setNodes((p) => ({ ...p, [db]: { ...p[db], expanded: false } }));
        return;
      }

      // Expand — use cached tables if available
      if (node.loaded) {
        setNodes((p) => ({ ...p, [db]: { ...p[db], expanded: true } }));
        return;
      }

      // Fetch tables lazily
      setNodes((p) => ({
        ...p,
        [db]: { ...p[db], expanded: true, loading: true },
      }));
      try {
        const tables = await invoke<string[]>("get_tables", { dbName: db });
        setNodes((p) => ({
          ...p,
          [db]: { ...p[db], tables, loading: false, loaded: true },
        }));
      } catch {
        setNodes((p) => ({
          ...p,
          [db]: { ...p[db], expanded: false, loading: false },
        }));
      }
    },
    [nodes]
  );

  const q = search.toLowerCase();

  const visible = useMemo(() => {
    if (!q) return databases;
    return databases.filter((db) => {
      if (db.toLowerCase().includes(q)) return true;
      return (nodes[db]?.tables ?? []).some((t) => t.toLowerCase().includes(q));
    });
  }, [q, databases, nodes]);

  return (
    <div className="h-full flex flex-col">
      {/* Server pill */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <RiServerLine className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground truncate">
            {connectionInfo.host}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
          MySQL · Port {connectionInfo.port} · {databases.length} databases
        </p>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-border shrink-0">
        <div className="relative">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-6 pl-7 text-[11px] bg-background/60 border-border/60"
          />
        </div>
      </div>

      {/* Label row */}
      <div className="px-3 py-1 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Databases
        </span>
        <button
          className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded"
          title="Refresh"
        >
          <RiRefreshLine className="size-3" />
        </button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="px-1.5 pb-3 space-y-px">
          {visible.map((db) => {
            const node = nodes[db]!;
            const tableList =
              q && node.loaded
                ? node.tables.filter((t) => t.toLowerCase().includes(q))
                : node.tables;

            return (
              <div key={db}>
                {/* DB row */}
                <button
                  onClick={() => toggleDb(db)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all hover:bg-accent group"
                >
                  {node.loading ? (
                    <RiLoader4Line className="size-3 text-muted-foreground animate-spin shrink-0" />
                  ) : node.expanded ? (
                    <RiArrowDownSLine className="size-3 text-muted-foreground shrink-0" />
                  ) : (
                    <RiArrowRightSLine className="size-3 text-muted-foreground shrink-0" />
                  )}
                  <RiDatabase2Line className="size-3.5 text-muted-foreground/60 group-hover:text-primary shrink-0 transition-colors" />
                  <span className="truncate font-medium text-foreground/80 group-hover:text-foreground flex-1 text-left">
                    {db}
                  </span>
                  {node.loaded && (
                    <span className="text-[10px] text-muted-foreground/35 shrink-0">
                      {node.tables.length}
                    </span>
                  )}
                </button>

                {/* Tables subtree */}
                {node.expanded && !node.loading && (
                  <div className="ml-5 mt-px border-l border-border/50 pl-2 space-y-px">
                    {tableList.map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => onOpenTable(db, tbl)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-all group"
                      >
                        <RiTableLine className="size-3 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        <span className="truncate">{tbl}</span>
                      </button>
                    ))}

                    {tableList.length === 0 && node.loaded && (
                      <p className="px-2 py-1 text-[11px] text-muted-foreground/40 italic">
                        {q ? "No matches" : "No tables"}
                      </p>
                    )}

                    {/* New query shortcut */}
                    <button
                      onClick={() => onOpenQuery(db)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 mt-1 rounded-md text-[11px] text-muted-foreground/40 hover:text-primary hover:bg-accent transition-all border border-dashed border-border/30 hover:border-primary/30"
                    >
                      <RiCodeLine className="size-3 shrink-0" />
                      New query
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {visible.length === 0 && (
            <p className="py-5 text-center text-[11px] text-muted-foreground/50">
              No results for &quot;{search}&quot;
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
