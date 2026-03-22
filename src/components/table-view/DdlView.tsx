import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiAlertLine, RiFileCopyLine } from "@remixicon/react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard } from "@/hooks/useClipboard";

interface Props {
  db: string;
  table: string;
}

export default function DdlView({ db, table }: Props) {
  const [ddl, setDdl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setDdl("");

    invoke<string>("get_table_ddl", { dbName: db, tableName: table })
      .then(setDdl)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [db, table]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: `${70 + Math.random() * 30}%`,
              opacity: 1 - i * 0.1,
            }}
          />
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/30">
        <span className="text-[11px] text-muted-foreground">
          <span className="font-mono text-foreground/60">{db}</span>
          <span className="text-muted-foreground/40 mx-1">/</span>
          <span className="font-mono text-foreground/60">{table}</span>
        </span>
        <button
          onClick={() => copyToClipboard(ddl, "DDL copied to clipboard")}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <RiFileCopyLine className="size-3" />
          Copy
        </button>
      </div>

      {/* DDL code block */}
      <ScrollArea className="flex-1">
        <pre className="p-4 text-[11px] leading-relaxed font-mono text-foreground/80 whitespace-pre-wrap break-words">
          {/* Basic keyword highlighting via spans */}
          {tokenise(ddl)}
        </pre>
      </ScrollArea>
    </div>
  );
}

// ── Lightweight SQL keyword colouring ─────────────────────────────────────────
// No external parser — splits on word boundaries and colours known tokens.

const KW = new Set([
  "CREATE",
  "TABLE",
  "NOT",
  "NULL",
  "DEFAULT",
  "AUTO_INCREMENT",
  "PRIMARY",
  "KEY",
  "UNIQUE",
  "INDEX",
  "CONSTRAINT",
  "FOREIGN",
  "REFERENCES",
  "ENGINE",
  "CHARSET",
  "COLLATE",
  "COMMENT",
  "IF",
  "EXISTS",
  "INT",
  "BIGINT",
  "VARCHAR",
  "TEXT",
  "TINYINT",
  "SMALLINT",
  "MEDIUMINT",
  "FLOAT",
  "DOUBLE",
  "DECIMAL",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "BOOLEAN",
  "BLOB",
  "JSON",
  "ENUM",
  "SET",
  "ON",
  "DELETE",
  "UPDATE",
  "CASCADE",
  "RESTRICT",
  "UNSIGNED",
  "SIGNED",
]);

function tokenise(sql: string): React.ReactNode {
  // Split preserving delimiters: backtick-quoted, single-quoted, numbers, words, rest
  const tokens = sql.split(
    /(`[^`]*`|'[^']*'|\b\d+\b|\b[A-Z_]+\b|[^`'\w]+)/gi
  );
  return tokens.map((tok, i) => {
    if (!tok) return null;
    const up = tok.toUpperCase();
    if (KW.has(up))
      return (
        <span key={i} className="text-sky-400/90">
          {tok}
        </span>
      );
    if (/^`[^`]*`$/.test(tok))
      return (
        <span key={i} className="text-emerald-400/80">
          {tok}
        </span>
      );
    if (/^'[^']*'$/.test(tok))
      return (
        <span key={i} className="text-amber-400/80">
          {tok}
        </span>
      );
    if (/^\d+$/.test(tok))
      return (
        <span key={i} className="text-purple-400/80">
          {tok}
        </span>
      );
    return <span key={i}>{tok}</span>;
  });
}
