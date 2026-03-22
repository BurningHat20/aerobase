import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
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

const PAGE_SIZES = [25, 50, 100, 250, 500] as const;
const ROW_HEIGHT = 34;

interface Props {
  db: string;
  table: string;
}

export default function DataGrid({ db, table }: Props) {
  const [data, setData] = useState<TableDataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(100);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [filter, setFilter] = useState("");
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const ctxRef = useRef<{ row: string[]; colIdx: number } | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
    setColumnSizing({});
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
  const visibleRows = useMemo(() => {
    if (!data) return [];
    const rows = data.rows.map((row, idx) => ({ row, origIdx: idx }));
    if (!filterLower) return rows;
    return rows.filter(({ row }) =>
      row.some((c) => c.toLowerCase().includes(filterLower))
    );
  }, [data, filterLower]);

  const columns = useMemo<ColumnDef<{ row: string[]; origIdx: number }>[]>(() => {
    if (!data) return [];
    return [
      {
        id: "__row_num",
        header: "#",
        size: 52,
        minSize: 40,
        maxSize: 64,
        enableResizing: false,
        cell: ({ row }) => {
          const from = page * pageSize + 1;
          return (
            <span className="text-muted-foreground/20 text-[11px] tabular-nums select-none">
              {from + row.original.origIdx}
            </span>
          );
        },
      },
      ...data.columns.map((col, colIdx) => ({
        id: col,
        accessorFn: (row: { row: string[]; origIdx: number }) => row.row[colIdx],
        header: col,
        size: 170,
        minSize: 70,
        cell: (info: { getValue: () => unknown }) => {
          const val = String(info.getValue() ?? "");
          if (val === "NULL") {
            return (
              <span className="text-muted-foreground/20 italic text-[11px]">
                NULL
              </span>
            );
          }
          return <span className="text-foreground/80">{val}</span>;
        },
      } as ColumnDef<{ row: string[]; origIdx: number }>)),
    ];
  }, [data, page, pageSize]);

  const sorting = useMemo<SortingState>(() => {
    if (!sortCol) return [];
    return [{ id: sortCol, desc: sortDir === "DESC" }];
  }, [sortCol, sortDir]);

  const tableInstance = useReactTable({
    data: visibleRows,
    columns,
    state: { sorting, columnSizing },
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows: tableRows } = tableInstance.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  if (loading && !data)
    return (
      <div className="p-5 space-y-2">
        <Skeleton className="h-9 w-full rounded-md" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-full rounded-sm"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="flex items-start gap-3 m-5 p-4 rounded-lg text-sm bg-destructive/8 text-destructive border border-destructive/20">
        <RiAlertLine className="size-4 shrink-0 mt-0.5" />
        <span className="font-mono leading-relaxed">{error}</span>
      </div>
    );

  if (!data || !data.columns.length)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <RiDatabase2Line className="size-10 opacity-10" />
        <p className="text-sm">No columns in this table</p>
      </div>
    );

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, data.total);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-10 border-b border-border">
        <div className="relative w-56">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter rows..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-7 pl-8 pr-3 text-xs bg-transparent border border-border rounded-md text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>

        {filter && filterLower && (
          <Badge
            variant="secondary"
            className="h-5 text-[11px] px-1.5 font-mono shrink-0"
          >
            {visibleRows.length}/{data.rows.length}
          </Badge>
        )}

        {sortCol && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <span className="font-mono text-foreground/50">
              {sortCol}
            </span>
            {sortDir === "ASC" ? (
              <RiArrowUpSLine className="size-3.5 text-foreground/60" />
            ) : (
              <RiArrowDownSLine className="size-3.5 text-foreground/60" />
            )}
            <button
              onClick={() => {
                setSortCol(null);
                setSortDir("ASC");
                fetchData(page, pageSize, null, "ASC");
              }}
              className="text-muted-foreground/30 hover:text-muted-foreground text-[11px] underline ml-0.5"
            >
              clear
            </button>
          </span>
        )}

        <div className="flex-1" />

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

      {/* Virtualized table */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={tableContainerRef}
          className="h-full overflow-auto"
        >
          <table
            className="w-full text-xs border-collapse"
            style={{ width: tableInstance.getTotalSize() }}
          >
            <thead className="sticky top-0 z-10">
              {tableInstance.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-card border-b border-border">
                  {headerGroup.headers.map((header) => {
                    const isRowNum = header.id === "__row_num";
                    const isSorted = sorting.some((s) => s.id === header.id);
                    return (
                      <th
                        key={header.id}
                        className={[
                          "relative px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap select-none",
                          "border-r border-border last:border-r-0",
                          isRowNum
                            ? "text-muted-foreground/25 text-right font-normal text-[11px]"
                            : isSorted
                            ? "text-foreground cursor-pointer"
                            : "text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent/50 transition-colors",
                        ].join(" ")}
                        style={{ width: header.getSize() }}
                        onClick={() => {
                          if (!isRowNum) handleSort(header.id);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {!isRowNum && isSorted && (
                            sortDir === "ASC" ? (
                              <RiArrowUpSLine className="size-3.5 text-foreground shrink-0" />
                            ) : (
                              <RiArrowDownSLine className="size-3.5 text-foreground shrink-0" />
                            )
                          )}
                        </div>
                        {!isRowNum && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-foreground/15 transition-colors ${
                              header.column.getIsResizing() ? "bg-foreground/20" : ""
                            }`}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = tableRows[virtualRow.index];
                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <tr
                        className="border-b border-border/50 hover:bg-accent/40 transition-colors absolute w-full"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isRowNum = cell.column.id === "__row_num";
                          const colIdx = data.columns.indexOf(cell.column.id);
                          return (
                            <td
                              key={cell.id}
                              title={
                                !isRowNum && row.original.row[colIdx] !== "NULL"
                                  ? row.original.row[colIdx]
                                  : undefined
                              }
                              onContextMenu={() => {
                                if (!isRowNum) {
                                  ctxRef.current = { row: row.original.row, colIdx };
                                }
                              }}
                              onClick={() => {
                                if (!isRowNum && row.original.row[colIdx] !== "NULL") {
                                  copyToClipboard(row.original.row[colIdx], "Copied");
                                }
                              }}
                              className={[
                                "px-3 py-2 font-mono text-xs border-r border-border/30 last:border-r-0",
                                "overflow-hidden text-ellipsis whitespace-nowrap",
                                isRowNum
                                  ? "text-right select-none"
                                  : "cursor-pointer hover:bg-accent/30 transition-colors",
                              ].join(" ")}
                              style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-48 text-xs">
                      <ContextMenuItem
                        onClick={() => {
                          const c = ctxRef.current;
                          if (c) copyToClipboard(c.row[c.colIdx], "Cell copied");
                        }}
                      >
                        Copy Cell
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              Object.fromEntries(
                                data.columns.map((c, i) => [
                                  c,
                                  row.original.row[i] === "NULL" ? null : row.original.row[i],
                                ])
                              ),
                              null,
                              2
                            ),
                            "Row as JSON"
                          )
                        }
                      >
                        Copy Row as JSON
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() =>
                          copyToClipboard(
                            toCSV(data.columns, [row.original.row]),
                            "Row as CSV"
                          )
                        }
                      >
                        Copy Row as CSV
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() =>
                          copyToClipboard(
                            toInsert(table, data.columns, row.original.row),
                            "INSERT copied"
                          )
                        }
                      >
                        Copy as INSERT
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && data && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <RiLoader4Fill className="size-5 animate-spin text-foreground/30" />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex items-center justify-between px-4 h-9 border-t border-border text-xs">
        <span className="text-muted-foreground tabular-nums">
          {data.total === 0 ? (
            "No rows"
          ) : (
            <>
              {from.toLocaleString()}-{to.toLocaleString()} of{" "}
              <strong className="text-foreground font-medium">
                {data.total.toLocaleString()}
              </strong>
            </>
          )}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px]">Rows</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger className="h-6 w-16 text-[11px] border-border bg-transparent">
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
                className="size-6 p-0 rounded-sm"
                disabled={page === 0 || loading}
                onClick={() => goTo(page - 1)}
              >
                <RiArrowLeftSLine className="size-3.5" />
              </Button>
              <span className="text-muted-foreground tabular-nums px-1.5 min-w-14 text-center text-[11px]">
                {page + 1}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 rounded-sm"
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
