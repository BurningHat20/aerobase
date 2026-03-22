import { useCallback, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCodeLine,
  RiDatabase2Line,
  RiLoader3Line,
  RiRefreshLine,
  RiSearchLine,
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
      if (node.expanded) {
        setNodes((p) => ({ ...p, [db]: { ...p[db], expanded: false } }));
        return;
      }
      if (node.loaded) {
        setNodes((p) => ({ ...p, [db]: { ...p[db], expanded: true } }));
        return;
      }
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

  const q = search.toLowerCase().trim();

  const visible = useMemo(() => {
    if (!q) return databases;
    return databases.filter((db) => {
      if (db.toLowerCase().includes(q)) return true;
      return (nodes[db]?.tables ?? []).some((t) => t.toLowerCase().includes(q));
    });
  }, [q, databases, nodes]);

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Server info header */}
      <div className="px-3 py-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <RiDatabase2Line className="size-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
              {connectionInfo.host}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              :{connectionInfo.port} · {databases.length} databases
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-2.5 py-2 border-b border-sidebar-border shrink-0">
        <div className="relative">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search databases & tables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-background/50 border-border/60 rounded-lg placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          {q ? `${visible.length}/${databases.length} results` : "Databases"}
        </span>
        <button
          className="p-0.5 text-muted-foreground/35 hover:text-muted-foreground transition-colors rounded"
          title="Refresh"
        >
          <RiRefreshLine className="size-3" />
        </button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-px">
          {visible.length === 0 && (
            <p className="text-center text-xs text-muted-foreground/40 py-8">
              No results for "{search}"
            </p>
          )}

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
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-sidebar-accent group text-sidebar-foreground"
                >
                  <span className="size-3.5 flex items-center justify-center shrink-0">
                    {node.loading ? (
                      <RiLoader3Line className="size-3.5 text-muted-foreground animate-spin" />
                    ) : node.expanded ? (
                      <RiArrowDownSLine className="size-3.5 text-muted-foreground" />
                    ) : (
                      <RiArrowRightSLine className="size-3.5 text-muted-foreground" />
                    )}
                  </span>
                  <RiDatabase2Line className="size-3.5 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
                  <span className="flex-1 text-left truncate font-medium leading-none">
                    {db}
                  </span>
                  {node.loaded && (
                    <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                      {node.tables.length}
                    </span>
                  )}
                </button>

                {/* Tables sub-list */}
                {node.expanded && !node.loading && (
                  <div className="ml-4 mt-px pl-2 border-l border-border/40">
                    {tableList.map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => onOpenTable(db, tbl)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group"
                      >
                        <RiTableLine className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                        <span className="truncate font-medium">{tbl}</span>
                      </button>
                    ))}

                    {tableList.length === 0 && node.loaded && (
                      <p className="px-2 py-1.5 text-[11px] text-muted-foreground/35 italic">
                        {q ? "No matches" : "Empty database"}
                      </p>
                    )}

                    {/* New query shortcut */}
                    <button
                      onClick={() => onOpenQuery(db)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 rounded-lg text-[11px] text-muted-foreground/40 hover:text-primary hover:bg-sidebar-accent transition-all border border-dashed border-border/30 hover:border-primary/30"
                    >
                      <RiCodeLine className="size-3 shrink-0" />
                      New query
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
