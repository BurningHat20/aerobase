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
  onTablesLoaded?: (db: string, tables: string[]) => void;
}

export default function Sidebar({
  connectionInfo,
  databases,
  onOpenTable,
  onOpenQuery,
  onTablesLoaded,
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

  const fetchTables = useCallback(async (db: string) => {
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
      onTablesLoaded?.(db, tables);
    } catch {
      setNodes((p) => ({
        ...p,
        [db]: { ...p[db], expanded: false, loading: false },
      }));
    }
  }, [onTablesLoaded]);

  const toggleDb = useCallback(
    (db: string) => {
      setNodes((prev) => {
        const node = prev[db];
        if (!node) return prev;
        if (node.expanded) {
          return { ...prev, [db]: { ...node, expanded: false } };
        }
        if (node.loaded) {
          return { ...prev, [db]: { ...node, expanded: true } };
        }
        fetchTables(db);
        return prev;
      });
    },
    [fetchTables]
  );

  const refreshAll = useCallback(() => {
    const expandedDbs = Object.entries(nodes)
      .filter(([, n]) => n.expanded)
      .map(([db]) => db);
    setNodes(
      Object.fromEntries(
        databases.map((db) => [
          db,
          { tables: [], expanded: false, loading: false, loaded: false },
        ])
      )
    );
    expandedDbs.forEach(fetchTables);
  }, [nodes, databases, fetchTables]);

  const q = search.toLowerCase().trim();

  const visible = useMemo(() => {
    if (!q) return databases;
    return databases.filter((db) => {
      if (db.toLowerCase().includes(q)) return true;
      return (nodes[db]?.tables ?? []).some((t) => t.toLowerCase().includes(q));
    });
  }, [q, databases, nodes]);

  return (
    <div className="h-full flex flex-col bg-sidebar select-none">
      {/* Search */}
      <div className="px-3 py-3 shrink-0">
        <div className="relative">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-transparent border border-border rounded-md text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between px-4 pb-1.5 shrink-0">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">
          {q ? `${visible.length} result${visible.length !== 1 ? "s" : ""}` : `Databases`}
        </span>
        <button
          onClick={refreshAll}
          className="p-1 text-muted-foreground/25 hover:text-muted-foreground transition-colors rounded"
          title="Refresh all"
        >
          <RiRefreshLine className="size-3.5" />
        </button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-0.5">
          {visible.length === 0 && (
            <p className="text-center text-xs text-muted-foreground/25 py-8">
              No matches
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
                <button
                  onClick={() => toggleDb(db)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors hover:bg-sidebar-accent group text-sidebar-foreground"
                >
                  <span className="size-4 flex items-center justify-center shrink-0">
                    {node.loading ? (
                      <RiLoader3Line className="size-3.5 text-muted-foreground animate-spin" />
                    ) : node.expanded ? (
                      <RiArrowDownSLine className="size-4 text-muted-foreground/50" />
                    ) : (
                      <RiArrowRightSLine className="size-4 text-muted-foreground/50" />
                    )}
                  </span>
                  <RiDatabase2Line className="size-3.5 text-muted-foreground/40 shrink-0 group-hover:text-foreground/60 transition-colors" />
                  <span className="flex-1 text-left truncate font-medium leading-none">
                    {db}
                  </span>
                  {node.loaded && (
                    <span className="text-[11px] text-muted-foreground/25 tabular-nums shrink-0">
                      {node.tables.length}
                    </span>
                  )}
                </button>

                {node.expanded && !node.loading && (
                  <div className="ml-5 pl-3 border-l border-border">
                    {tableList.map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => onOpenTable(db, tbl)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group"
                      >
                        <RiTableLine className="size-3.5 text-muted-foreground/25 group-hover:text-foreground/50 transition-colors shrink-0" />
                        <span className="truncate font-medium">{tbl}</span>
                      </button>
                    ))}

                    {tableList.length === 0 && node.loaded && (
                      <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground/20 italic">
                        {q ? "No matches" : "Empty"}
                      </p>
                    )}

                    <button
                      onClick={() => onOpenQuery(db)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 mt-0.5 rounded-md text-[11px] text-muted-foreground/25 hover:text-foreground/60 hover:bg-sidebar-accent transition-all"
                    >
                      <RiCodeLine className="size-3.5 shrink-0" />
                      New query
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2.5 border-t border-sidebar-border">
        <p className="text-[11px] text-muted-foreground/25 font-mono truncate">
          {connectionInfo.user}@{connectionInfo.host}:{connectionInfo.port}
        </p>
      </div>
    </div>
  );
}
