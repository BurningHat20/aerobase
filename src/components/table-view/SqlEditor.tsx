import { useCallback, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { copyToClipboard, toCSV, toJSON } from "@/hooks/useClipboard";
import type { QueryResult, StatementResult } from "@/types";

// ── Statement splitter (quote-aware) ─────────────────────────────────────────
function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let cur = "",
    inS = false,
    inD = false,
    esc = false;
  for (const ch of sql) {
    if (esc) {
      // Previous char was backslash — consume this char literally
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

// ── Result table ──────────────────────────────────────────────────────────────
function ResultTable({
  result,
  label,
}: {
  result: QueryResult;
  label?: string;
}) {
  if (!result.is_select) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs">
        <RiCheckboxCircleLine className="size-4 shrink-0" />
        <span className="flex-1">
          {label && (
            <span className="text-muted-foreground mr-2 font-mono">
              {label}
            </span>
          )}
          Query OK — <strong>{result.rows_affected.toLocaleString()}</strong>{" "}
          row{result.rows_affected !== 1 ? "s" : ""} affected
        </span>
        <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
          <RiTimeLine className="size-3" />
          {result.query_time_ms}ms
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden">
      {/* Result header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border text-xs">
        {label && (
          <>
            <span className="font-mono text-muted-foreground/60 text-[11px]">
              {label}
            </span>
            <Separator orientation="vertical" className="h-3.5" />
          </>
        )}
        <Badge
          variant="secondary"
          className="h-5 text-[10px] px-1.5 font-mono gap-1"
        >
          {result.rows.length.toLocaleString()} rows
        </Badge>
        <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
          <RiTimeLine className="size-3" />
          {result.query_time_ms}ms
        </span>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              >
                <RiDownloadLine className="size-3" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-40">
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(
                    toCSV(result.columns, result.rows),
                    "Copied as CSV"
                  )
                }
              >
                Copy as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  copyToClipboard(
                    toJSON(result.columns, result.rows),
                    "Copied as JSON"
                  )
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
              <tr className="border-b border-border bg-card">
                <th className="w-9 px-2 py-2 text-right text-[10px] font-normal text-muted-foreground/30 border-r border-border/40 select-none">
                  #
                </th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap border-r border-border/30 last:border-r-0 min-w-20"
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
                  className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-2 py-1.5 text-right font-mono text-[10px] text-muted-foreground/25 border-r border-border/20 select-none tabular-nums">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      title={cell === "NULL" ? undefined : cell}
                      onClick={() =>
                        cell !== "NULL" && copyToClipboard(cell, "Copied")
                      }
                      className="px-3 py-1.5 font-mono text-[11px] border-r border-border/15 last:border-r-0 max-w-60 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      {cell === "NULL" ? (
                        <span className="text-muted-foreground/25 italic">
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
        <p className="py-8 text-center text-xs text-muted-foreground/40">
          No rows returned
        </p>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
  db: string;
  databases: string[];
}

export default function SqlEditor({ db, databases }: Props) {
  const [selectedDb, setSelectedDb] = useState(db);
  const [sql, setSql] = useState("SELECT * FROM ");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StatementResult[]>([]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Editor toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-10 border-b border-border bg-card/50">
        <RiCodeLine className="size-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-medium text-foreground/70">
          SQL Editor
        </span>
        <Separator orientation="vertical" className="h-4 mx-0.5" />

        {/* DB selector */}
        <Select value={selectedDb} onValueChange={setSelectedDb}>
          <SelectTrigger className="h-7 w-44 text-xs border-border/60 bg-background/60 font-mono">
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
            className="h-5 text-[10px] px-1.5 font-mono"
          >
            {stmtCount} stmts
          </Badge>
        )}

        <span className="text-[10px] text-muted-foreground/40 select-none hidden sm:block">
          Ctrl+Enter
        </span>

        <Button
          size="sm"
          className="h-7 px-3 text-xs gap-1.5 font-medium"
          onClick={runAll}
          disabled={running || !sql.trim()}
        >
          {running ? (
            <RiLoader4Fill className="size-3.5 animate-spin" />
          ) : (
            <RiPlayFill className="size-3.5" />
          )}
          {running ? "Running…" : "Run"}
        </Button>
      </div>

      {/* ── Editor ── */}
      <div
        className="shrink-0 relative border-b border-border"
        style={{ height: 160 }}
      >
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              runAll();
            }
          }}
          spellCheck={false}
          placeholder={
            "SELECT * FROM table_name LIMIT 100;\n\n-- Separate multiple statements with semicolons"
          }
          className="absolute inset-0 w-full h-full resize-none rounded-none border-0 font-mono text-xs leading-relaxed p-3.5 bg-background focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
        />
        {/* Line number gutter hint */}
        <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-border/40 bg-muted/20 pointer-events-none" />
      </div>

      {/* ── Results ── */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {!results.length && !running && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <RiCodeLine className="size-8 text-muted-foreground/15" />
              <p className="text-xs text-muted-foreground/40">
                Write a query above and press{" "}
                <kbd className="text-[10px] px-1 py-px rounded bg-muted font-mono">
                  Ctrl+Enter
                </kbd>
              </p>
            </div>
          )}

          {running && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <RiLoader4Fill className="size-4 animate-spin text-primary" />
              Executing…
            </div>
          )}

          {results.map((sr) => (
            <div key={sr.index}>
              {results.length > 1 && (
                <p className="text-[10px] text-muted-foreground/40 font-mono mb-1.5 px-0.5 truncate">
                  [{sr.index + 1}] {sr.sql.slice(0, 80)}
                  {sr.sql.length > 80 ? "…" : ""}
                </p>
              )}
              {sr.error ? (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs bg-destructive/8 text-destructive border border-destructive/20">
                  <RiAlertLine className="size-3.5 shrink-0 mt-px" />
                  <span className="font-mono leading-relaxed break-all">
                    {sr.error}
                  </span>
                </div>
              ) : sr.result ? (
                <ResultTable
                  result={sr.result}
                  label={
                    results.length > 1 ? `Statement ${sr.index + 1}` : undefined
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
