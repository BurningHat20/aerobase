import { useCallback, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCodeLine,
  RiDownloadLine,
  RiLoader4Fill,
  RiPlayFill,
  RiTimeLine,
} from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { copyToClipboard, toCSV, toJSON } from "@/hooks/useClipboard";
import { useTheme } from "@/hooks/useTheme";
import CodeEditor from "@/components/editor/CodeEditor";
import type { QueryResult, StatementResult } from "@/types";

// Statement splitter (quote-aware)
function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let cur = "",
    inS = false,
    inD = false,
    esc = false;
  for (const ch of sql) {
    if (esc) {
      cur += ch;
      esc = false;
      continue;
    }
    if (ch === "\\" && (inS || inD)) {
      cur += ch;
      esc = true;
      continue;
    }
    if (ch === "'" && !inD) {
      inS = !inS;
      cur += ch;
      continue;
    }
    if (ch === '"' && !inS) {
      inD = !inD;
      cur += ch;
      continue;
    }
    if (ch === ";" && !inS && !inD) {
      const t = cur.trim();
      if (t) stmts.push(t);
      cur = "";
      continue;
    }
    cur += ch;
  }
  const t = cur.trim();
  if (t) stmts.push(t);
  return stmts;
}

// Inline result table
function ResultTable({
  result,
  label,
}: {
  result: QueryResult;
  label?: string;
}) {
  if (!result.is_select) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-xs">
        <RiCheckboxCircleLine className="size-4 shrink-0" />
        <span className="flex-1">
          {label && (
            <span className="text-muted-foreground mr-2 font-mono text-[10px]">
              {label}
            </span>
          )}
          Query OK — <strong>{result.rows_affected.toLocaleString()}</strong>{" "}
          row{result.rows_affected !== 1 ? "s" : ""} affected
        </span>
        <span className="flex items-center gap-1 text-muted-foreground tabular-nums text-[10px]">
          <RiTimeLine className="size-3" />
          {result.query_time_ms}ms
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-border/60 rounded-lg overflow-hidden">
      {/* Result header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border-b border-border/40 text-[11px]">
        {label && (
          <>
            <span className="font-mono text-muted-foreground/50 text-[10px]">
              {label}
            </span>
            <Separator orientation="vertical" className="h-3" />
          </>
        )}
        <Badge
          variant="secondary"
          className="h-4 text-[9px] px-1 font-mono"
        >
          {result.rows.length} rows
        </Badge>
        <span className="flex items-center gap-1 text-muted-foreground tabular-nums text-[10px]">
          <RiTimeLine className="size-2.5" />
          {result.query_time_ms}ms
        </span>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              >
                <RiDownloadLine className="size-2.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-36">
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(toCSV(result.columns, result.rows), "CSV")
                }
              >
                Copy as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(toJSON(result.columns, result.rows), "JSON")
                }
              >
                Copy as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {result.rows.length > 0 ? (
        <ScrollArea className="max-h-64">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-card border-b border-border/40">
                <th className="w-8 px-2 py-1.5 text-right text-[9px] font-normal text-muted-foreground/25 border-r border-border/15 select-none">
                  #
                </th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-2.5 py-1.5 text-left text-[10px] font-semibold text-muted-foreground whitespace-nowrap border-r border-border/15 last:border-r-0 min-w-16"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-border/10 hover:bg-accent/15 transition-colors"
                >
                  <td className="px-2 py-1 text-right font-mono text-[9px] text-muted-foreground/20 border-r border-border/10 select-none tabular-nums">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      title={cell === "NULL" ? undefined : cell}
                      onClick={() =>
                        cell !== "NULL" && copyToClipboard(cell, "Copied")
                      }
                      className="px-2.5 py-1 font-mono text-[10px] border-r border-border/10 last:border-r-0 max-w-56 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      {cell === "NULL" ? (
                        <span className="text-muted-foreground/20 italic text-[9px]">
                          NULL
                        </span>
                      ) : (
                        <span className="text-foreground/80">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <p className="py-6 text-center text-[11px] text-muted-foreground/30">
          No rows returned
        </p>
      )}
    </div>
  );
}

// Main
interface Props {
  db: string;
  databases: string[];
}

export default function SqlEditor({ db, databases }: Props) {
  const [selectedDb, setSelectedDb] = useState(db);
  const [sql, setSql] = useState("SELECT * FROM ");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StatementResult[]>([]);
  const [editorHeight, setEditorHeight] = useState(180);
  const { theme } = useTheme();

  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const runAll = useCallback(async () => {
    const stmts = splitStatements(sql);
    if (!stmts.length) return;
    setRunning(true);
    setResults([]);
    const out: StatementResult[] = [];
    for (let i = 0; i < stmts.length; i++) {
      try {
        const res = await invoke<QueryResult>("execute_query", {
          dbName: selectedDb,
          sql: stmts[i],
        });
        out.push({ index: i, sql: stmts[i], result: res, error: "" });
      } catch (err) {
        out.push({ index: i, sql: stmts[i], result: null, error: String(err) });
        break;
      }
    }
    setResults(out);
    setRunning(false);
  }, [sql, selectedDb]);

  const stmtCount = splitStatements(sql).length;

  // Vertical resize for editor
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      startH.current = editorHeight;
      (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [editorHeight]
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const delta = e.clientY - startY.current;
      setEditorHeight(Math.max(80, Math.min(500, startH.current + delta)));
    },
    []
  );

  const onResizePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-10 border-b border-border">
        <RiCodeLine className="size-4 text-muted-foreground/40 shrink-0" />

        {/* DB selector */}
        <Select value={selectedDb} onValueChange={setSelectedDb}>
          <SelectTrigger className="h-7 w-40 text-xs border-border bg-transparent font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {databases.map((d) => (
              <SelectItem key={d} value={d} className="text-xs font-mono">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {stmtCount > 1 && (
          <Badge
            variant="secondary"
            className="h-4 text-[9px] px-1 font-mono"
          >
            {stmtCount} stmts
          </Badge>
        )}

        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>Enter</Kbd>
        </KbdGroup>

        <Button
          size="sm"
          className="h-7 px-3.5 text-xs gap-1.5 font-medium"
          onClick={runAll}
          disabled={running || !sql.trim()}
        >
          {running ? (
            <RiLoader4Fill className="size-3 animate-spin" />
          ) : (
            <RiPlayFill className="size-3" />
          )}
          {running ? "Running..." : "Run"}
        </Button>
      </div>

      {/* Editor */}
      <div
        className="shrink-0 border-b border-border bg-background"
        style={{ height: editorHeight }}
      >
        <CodeEditor
          value={sql}
          onChange={setSql}
          onRun={runAll}
          isDark={theme === "dark"}
          placeholder="SELECT * FROM table_name LIMIT 100;\n\n-- Separate multiple statements with semicolons"
        />
      </div>

      {/* Vertical resize handle */}
      <div
        className="shrink-0 h-1 cursor-row-resize hover:bg-primary/20 active:bg-primary/40 transition-colors group flex items-center justify-center"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
      >
        <div className="w-8 h-[2px] rounded-full bg-border group-hover:bg-primary/30 transition-colors" />
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {!results.length && !running && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <RiCodeLine className="size-8 text-muted-foreground/10" />
              <p className="text-[11px] text-muted-foreground/30 flex items-center gap-1.5 justify-center">
                Write a query and press{" "}
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              </p>
            </div>
          )}

          {running && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <RiLoader4Fill className="size-4 animate-spin text-primary" />
              Executing...
            </div>
          )}

          {results.map((sr) => (
            <div key={sr.index}>
              {results.length > 1 && (
                <p className="text-[10px] text-muted-foreground/30 font-mono mb-1 px-0.5 truncate">
                  [{sr.index + 1}] {sr.sql.slice(0, 80)}
                  {sr.sql.length > 80 ? "..." : ""}
                </p>
              )}
              {sr.error ? (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] bg-destructive/8 text-destructive border border-destructive/20">
                  <RiAlertLine className="size-3.5 shrink-0 mt-px" />
                  <span className="font-mono leading-relaxed break-all">
                    {sr.error}
                  </span>
                </div>
              ) : sr.result ? (
                <ResultTable
                  result={sr.result}
                  label={
                    results.length > 1 ? `Stmt ${sr.index + 1}` : undefined
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
