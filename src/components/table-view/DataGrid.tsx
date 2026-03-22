import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiAlertLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiDatabase2Line,
  RiDownloadLine,
  RiLoader4Line,
  RiSearchLine,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard, toCSV, toInsert, toJSON } from "@/hooks/useClipboard";
import type { SortDir, TableDataResult } from "@/types";

const PAGE_SIZES = [25, 50, 100, 250] as const;

interface Props {
  db: string;
  table: string;
}

export default function DataGrid({ db, table }: Props) {
  const [data, setData] = useState<TableDataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [filter, setFilter] = useState("");

  const ctxRef = useRef<{ row: string[]; colIdx: number } | null>(null);

  const fetchData = useCallback(
    async (pg: number, ps: number, col: string | null, dir: SortDir) => {
      setLoading(true);
      setError("");
      try {
        const result = await invoke<TableDataResult>("get_table_data", {
          dbName: db,
          tableName: table,
          page: pg,
          pageSize: ps,
          orderBy: col ?? undefined,
          orderDir: col ? dir : undefined,
        });
        setData(result);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [db, table]
  );

  // Reset on table change
  useEffect(() => {
    setPage(0);
    setData(null);
    setSortCol(null);
    setSortDir("ASC");
    setFilter("");
    fetchData(0, pageSize, null, "ASC");
  }, [db, table]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (pg: number) => {
    setPage(pg);
    fetchData(pg, pageSize, sortCol, sortDir);
  };

  const handlePageSize = (val: string) => {
    const ps = Number(val);
    setPageSize(ps);
    setPage(0);
    fetchData(0, ps, sortCol, sortDir);
  };

  const handleSort = (col: string) => {
    let newDir: SortDir = "ASC";
    if (col === sortCol) newDir = sortDir === "ASC" ? "DESC" : "ASC";
    setSortCol(col);
    setSortDir(newDir);
    setPage(0);
    fetchData(0, pageSize, col, newDir);
  };

  // ── Client-side quick filter on visible rows ──────────────────────────────
  const visibleRows = data
    ? filter.trim()
      ? data.rows.filter((row) =>
          row.some((cell) => cell.toLowerCase().includes(filter.toLowerCase()))
        )
      : data.rows
    : [];

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="p-4 space-y-1.5">
        <Skeleton className="h-7 w-full" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-6 w-full"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 m-4 p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
        <RiAlertLine className="size-3.5 shrink-0 mt-px" />
        <span className="font-mono leading-relaxed">{error}</span>
      </div>
    );
  }

  if (!data || data.columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <RiDatabase2Line className="size-8 opacity-15" />
        <p className="text-xs">This table has no columns</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, data.total);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/20">
        <div className="relative flex-1 max-w-64">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filter current page…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-6 pl-7 text-[11px] bg-background/60 border-border/50"
          />
        </div>
        {filter && (
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {visibleRows.length} / {data.rows.length} rows
          </span>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-card/90 backdrop-blur-sm">
                {/* Row # */}
                <th className="w-9 px-2 py-2 text-right font-normal text-muted-foreground/35 border-r border-border/40 select-none">
                  #
                </th>
                {data.columns.map((col) => {
                  const isActive = sortCol === col;
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-3 py-2 text-left font-semibold text-foreground/70 whitespace-nowrap border-r border-border/30 last:border-r-0 min-w-24 cursor-pointer hover:bg-accent/60 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1">
                        <span className={isActive ? "text-primary" : ""}>
                          {col}
                        </span>
                        {isActive ? (
                          sortDir === "ASC" ? (
                            <RiArrowUpSLine className="size-3.5 text-primary shrink-0" />
                          ) : (
                            <RiArrowDownSLine className="size-3.5 text-primary shrink-0" />
                          )
                        ) : (
                          <RiArrowUpSLine className="size-3.5 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, ri) => (
                <ContextMenu key={ri}>
                  <ContextMenuTrigger asChild>
                    <tr className="border-b border-border/30 hover:bg-accent/40 transition-colors">
                      <td className="w-9 px-2 py-1.5 text-right font-mono text-[10px] text-muted-foreground/30 border-r border-border/20 select-none">
                        {from + ri}
                      </td>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          title={cell === "NULL" ? undefined : cell}
                          className="px-3 py-1.5 font-mono border-r border-border/15 last:border-r-0 max-w-64 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-primary/5 transition-colors"
                          onContextMenu={() => {
                            ctxRef.current = { row, colIdx: ci };
                          }}
                          onClick={() =>
                            cell !== "NULL" &&
                            copyToClipboard(cell, "Cell copied")
                          }
                        >
                          {cell === "NULL" ? (
                            <span className="text-muted-foreground/25 italic text-[11px]">
                              NULL
                            </span>
                          ) : (
                            <span className="text-foreground/75">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-52 text-xs">
                    <ContextMenuItem
                      onClick={() => {
                        const ctx = ctxRef.current;
                        if (ctx)
                          copyToClipboard(ctx.row[ctx.colIdx], "Cell copied");
                      }}
                    >
                      Copy Cell Value
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(
                            Object.fromEntries(
                              data.columns.map((c, i) => [
                                c,
                                row[i] === "NULL" ? null : row[i],
                              ])
                            ),
                            null,
                            2
                          ),
                          "Row copied as JSON"
                        )
                      }
                    >
                      Copy Row as JSON
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        copyToClipboard(
                          `${data.columns.join(",")}\n${row.join(",")}`,
                          "Row copied as CSV"
                        )
                      }
                    >
                      Copy Row as CSV
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        copyToClipboard(
                          toInsert(table, data.columns, row),
                          "INSERT copied"
                        )
                      }
                    >
                      Copy as INSERT
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {visibleRows.length === 0 && filter && (
                <tr>
                  <td
                    colSpan={data.columns.length + 1}
                    className="py-8 text-center text-xs text-muted-foreground/40"
                  >
                    No rows match &quot;{filter}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Refresh overlay */}
        {loading && data && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <RiLoader4Line className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* ── Pagination + export bar ─────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-card/50 flex items-center justify-between px-3 py-1.5 gap-4">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {data.total === 0 ? (
            "No rows"
          ) : (
            <>
              {from.toLocaleString()}–{to.toLocaleString()} of{" "}
              <strong className="text-foreground">
                {data.total.toLocaleString()}
              </strong>{" "}
              rows
              {sortCol && (
                <span className="ml-2 text-muted-foreground/50">
                  sorted by{" "}
                  <span className="text-foreground/60 font-mono">
                    {sortCol}
                  </span>{" "}
                  {sortDir === "ASC" ? "↑" : "↓"}
                </span>
              )}
            </>
          )}
        </span>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <RiDownloadLine className="size-3" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-44">
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(
                    toCSV(data.columns, data.rows),
                    `${data.rows.length} rows copied as CSV`
                  )
                }
              >
                Copy page as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(
                    toJSON(data.columns, data.rows),
                    `${data.rows.length} rows copied as JSON`
                  )
                }
              >
                Copy page as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            Rows
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger className="h-6 w-14 text-xs border-border/50 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={page === 0 || loading}
                onClick={() => goTo(page - 1)}
              >
                <RiArrowLeftSLine className="size-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground tabular-nums px-1">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={page >= totalPages - 1 || loading}
                onClick={() => goTo(page + 1)}
              >
                <RiArrowRightSLine className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
