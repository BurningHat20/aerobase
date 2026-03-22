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
  RiLoader4Fill,
  RiSearchLine,
} from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
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

  useEffect(() => {
    setPage(0);
    setData(null);
    setSortCol(null);
    setSortDir("ASC");
    setFilter("");
    fetchData(0, pageSize, null, "ASC");
  }, [db, table]); // eslint-disable-line

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
    const dir: SortDir = col === sortCol && sortDir === "ASC" ? "DESC" : "ASC";
    setSortCol(col);
    setSortDir(dir);
    setPage(0);
    fetchData(0, pageSize, col, dir);
  };

  const filterLower = filter.trim().toLowerCase();
  const visibleRows: { row: string[]; origIdx: number }[] = data
    ? filterLower
      ? data.rows
          .map((row, idx) => ({ row, origIdx: idx }))
          .filter(({ row }) =>
            row.some((c) => c.toLowerCase().includes(filterLower))
          )
      : data.rows.map((row, idx) => ({ row, origIdx: idx }))
    : [];

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading && !data)
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-7 w-full"
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="flex items-start gap-2.5 m-4 p-3.5 rounded-xl text-xs bg-destructive/8 text-destructive border border-destructive/20">
        <RiAlertLine className="size-4 shrink-0 mt-px" />
        <span className="font-mono leading-relaxed">{error}</span>
      </div>
    );

  if (!data || !data.columns.length)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <RiDatabase2Line className="size-10 opacity-10" />
        <p className="text-xs font-medium">No columns in this table</p>
      </div>
    );

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, data.total);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-10 border-b border-border bg-card/50">
        {/* Quick filter */}
        <div className="relative w-56">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filter visible rows…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-7 pl-7 text-xs bg-background/60 border-border/60 placeholder:text-muted-foreground/40"
          />
        </div>

        {filter && filterLower && (
          <Badge
            variant="secondary"
            className="h-5 text-[10px] px-1.5 font-mono shrink-0"
          >
            {visibleRows.length}/{data.rows.length}
          </Badge>
        )}

        {sortCol && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              Sorted by
              <span className="font-mono text-foreground/70 font-medium">
                {sortCol}
              </span>
              {sortDir === "ASC" ? (
                <RiArrowUpSLine className="size-3.5 text-primary" />
              ) : (
                <RiArrowDownSLine className="size-3.5 text-primary" />
              )}
              <button
                onClick={() => {
                  setSortCol(null);
                  setSortDir("ASC");
                  fetchData(page, pageSize, null, "ASC");
                }}
                className="text-muted-foreground/50 hover:text-muted-foreground text-[10px] underline ml-0.5"
              >
                clear
              </button>
            </span>
          </>
        )}

        <div className="flex-1" />

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RiDownloadLine className="size-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs w-44">
            <DropdownMenuItem
              onClick={() =>
                copyToClipboard(
                  toCSV(data.columns, data.rows),
                  `${data.rows.length} rows as CSV`
                )
              }
            >
              Copy page as CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                copyToClipboard(
                  toJSON(data.columns, data.rows),
                  `${data.rows.length} rows as JSON`
                )
              }
            >
              Copy page as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Table ── */}
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-border bg-card">
                <th className="w-10 px-2 py-2.5 text-right text-[10px] font-normal text-muted-foreground/30 border-r border-border/30 select-none">
                  #
                </th>
                {data.columns.map((col) => {
                  const isActive = sortCol === col;
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className={[
                        "px-3 py-2.5 text-left text-[11px] font-semibold whitespace-nowrap cursor-pointer",
                        "border-r border-border/30 last:border-r-0 min-w-24 select-none",
                        "transition-colors hover:bg-accent/50 group",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        {isActive ? (
                          sortDir === "ASC" ? (
                            <RiArrowUpSLine className="size-3.5 text-primary shrink-0" />
                          ) : (
                            <RiArrowDownSLine className="size-3.5 text-primary shrink-0" />
                          )
                        ) : (
                          <RiArrowUpSLine className="size-3.5 opacity-0 group-hover:opacity-30 shrink-0 transition-opacity" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ row, origIdx }, ri) => (
                <ContextMenu key={origIdx}>
                  <ContextMenuTrigger asChild>
                    <tr
                      className={`border-b border-border/30 hover:bg-accent/25 transition-colors ${
                        ri % 2 !== 0 ? "bg-muted/10" : ""
                      }`}
                    >
                      <td className="w-10 px-2 py-2 text-right font-mono text-[10px] text-muted-foreground/25 border-r border-border/20 select-none tabular-nums">
                        {from + origIdx}
                      </td>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          title={cell !== "NULL" ? cell : undefined}
                          onContextMenu={() => {
                            ctxRef.current = { row, colIdx: ci };
                          }}
                          onClick={() =>
                            cell !== "NULL" && copyToClipboard(cell, "Copied")
                          }
                          className="px-3 py-2 font-mono text-[11px] border-r border-border/15 last:border-r-0 max-w-64 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          {cell === "NULL" ? (
                            <span className="text-muted-foreground/20 italic text-[10px]">
                              NULL
                            </span>
                          ) : (
                            <span className="text-foreground/80">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-52 text-xs">
                    <ContextMenuItem
                      onClick={() => {
                        const c = ctxRef.current;
                        if (c) copyToClipboard(c.row[c.colIdx], "Cell copied");
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
                          "Copied as JSON"
                        )
                      }
                    >
                      Copy Row as JSON
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        copyToClipboard(
                          toCSV(data.columns, [row]),
                          "Copied as CSV"
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

              {visibleRows.length === 0 && filterLower && (
                <tr>
                  <td
                    colSpan={data.columns.length + 1}
                    className="py-12 text-center text-xs text-muted-foreground/40"
                  >
                    No rows match "{filter}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {loading && data && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <RiLoader4Fill className="size-5 animate-spin text-primary/60" />
          </div>
        )}
      </div>

      {/* ── Pagination footer ── */}
      <div className="shrink-0 flex items-center justify-between px-3 h-9 border-t border-border bg-card/30 text-xs">
        {/* Count */}
        <span className="text-muted-foreground tabular-nums">
          {data.total === 0 ? (
            "No rows"
          ) : (
            <>
              {from.toLocaleString()}–{to.toLocaleString()} of{" "}
              <strong className="text-foreground font-semibold">
                {data.total.toLocaleString()}
              </strong>{" "}
              rows
            </>
          )}
        </span>

        <div className="flex items-center gap-2.5">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>Rows</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger className="h-6 w-16 text-xs border-border/50 bg-background/60">
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

          {/* Page navigation */}
          {totalPages > 1 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded"
                  disabled={page === 0 || loading}
                  onClick={() => goTo(page - 1)}
                >
                  <RiArrowLeftSLine className="size-3.5" />
                </Button>
                <span className="text-muted-foreground tabular-nums px-1 min-w-16 text-center">
                  {page + 1} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => goTo(page + 1)}
                >
                  <RiArrowRightSLine className="size-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
