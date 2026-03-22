import { useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiDownloadLine,
  RiLoader4Line,
  RiPlayLine,
  RiTimeLine,
} from "@remixicon/react";

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
import { Textarea } from "@/components/ui/textarea";
import { copyToClipboard, toCSV, toJSON } from "@/hooks/useClipboard";
import type { QueryResult, StatementResult } from "@/types";

// ── Statement parser ──────────────────────────────────────────────────────────
// Quote-aware split on `;` — handles single and double quoted strings.
function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      cur += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      cur += ch;
      continue;
    }
    if (ch === ";" && !inSingle && !inDouble) {
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <RiCheckboxCircleLine className="size-3.5 shrink-0" />
        <span>
          {label && <span className="text-muted-foreground mr-2">{label}</span>}
          OK — <strong>{result.rows_affected.toLocaleString()}</strong> row
          {result.rows_affected !== 1 ? "s" : ""} affected
        </span>
        <span className="ml-auto flex items-center gap-1 text-muted-foreground">
          <RiTimeLine className="size-3" />
          {result.query_time_ms}ms
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden">
      {/* Result toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-card/30 border-b border-border text-[11px] text-muted-foreground">
        {label && <span className="font-mono text-foreground/50">{label}</span>}
        <span>
          <strong className="text-foreground">
            {result.rows.length.toLocaleString()}
          </strong>{" "}
          row{result.rows.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <RiTimeLine className="size-3" />
          {result.query_time_ms}ms
        </span>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
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

      {/* Grid */}
      {result.rows.length > 0 ? (
        <ScrollArea className="max-h-72">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-card/90">
                <th className="w-9 px-2 py-1.5 text-right font-normal text-muted-foreground/35 border-r border-border/40 select-none">
                  #
                </th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-1.5 text-left font-semibold text-foreground/70 whitespace-nowrap border-r border-border/30 last:border-r-0 min-w-20"
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
                  className="border-b border-border/30 hover:bg-accent/40"
                >
                  <td className="w-9 px-2 py-1.5 text-right font-mono text-[10px] text-muted-foreground/30 border-r border-border/20 select-none">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      title={cell === "NULL" ? undefined : cell}
                      onClick={() =>
                        cell !== "NULL" && copyToClipboard(cell, "Cell copied")
                      }
                      className="px-3 py-1.5 font-mono border-r border-border/15 last:border-r-0 max-w-60 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-primary/5 transition-colors"
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
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <p className="py-6 text-center text-xs text-muted-foreground/50">
          Query returned no rows
        </p>
      )}
    </div>
  );
}

// ── SqlEditor ─────────────────────────────────────────────────────────────────
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
    if (stmts.length === 0) return;

    setRunning(true);
    setResults([]);

    const out: StatementResult[] = [];

    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      try {
        const res = await invoke<QueryResult>("execute_query", {
          dbName: selectedDb,
          sql: stmt,
        });
        out.push({ index: i, sql: stmt, result: res, error: "" });
      } catch (err) {
        out.push({ index: i, sql: stmt, result: null, error: String(err) });
        // Stop on first error — matches MySQL's default behaviour
        break;
      }
    }

    setResults(out);
    setRunning(false);
  }, [sql, selectedDb]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runAll();
    }
  };

  const stmtCount = splitStatements(sql).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border bg-card/50">
        <Select value={selectedDb} onValueChange={setSelectedDb}>
          <SelectTrigger className="h-7 w-48 text-xs border-border/50 bg-background/60">
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
          <span className="text-[10px] text-muted-foreground/50 select-none">
            {stmtCount} statements
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/40 select-none">
          Ctrl+Enter to run
        </span>

        <Button
          size="sm"
          className="h-7 px-3 text-xs gap-1.5"
          onClick={runAll}
          disabled={running || !sql.trim()}
        >
          {running ? (
            <RiLoader4Line className="size-3.5 animate-spin" />
          ) : (
            <RiPlayLine className="size-3.5" />
          )}
          Run
        </Button>
      </div>

      {/* ── Editor ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-36 border-b border-border">
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          placeholder="SELECT * FROM table_name LIMIT 100;&#10;&#10;-- Separate multiple statements with semicolons"
          className="w-full h-full resize-none rounded-none border-0 font-mono text-xs leading-relaxed p-3 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {results.length === 0 && !running && (
            <p className="text-center text-xs text-muted-foreground/35 py-8 select-none">
              Write a query above and press Run or Ctrl+Enter
            </p>
          )}

          {running && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <RiLoader4Line className="size-4 animate-spin" />
              Running…
            </div>
          )}

          {results.map((sr) => (
            <div key={sr.index}>
              {/* Statement label — only shown when multiple */}
              {results.length > 1 && (
                <p className="text-[10px] text-muted-foreground/40 font-mono mb-1 truncate px-0.5">
                  [{sr.index + 1}] {sr.sql.slice(0, 80)}
                  {sr.sql.length > 80 ? "…" : ""}
                </p>
              )}

              {sr.error ? (
                <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
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
