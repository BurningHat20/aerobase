import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiDatabase2Line, RiTableLine } from "@remixicon/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataGrid from "./DataGrid";
import StructureView from "./StructureView";
import DdlView from "./DdlView";
import type { TableInfo } from "@/types";

// ── Byte formatter ────────────────────────────────────────────────────────────
function fmtBytes(b: number): string {
  if (b <= 0) return "0 B";
  if (b < 1_024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1_024).toFixed(1)} KB`;
  if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} MB`;
  return `${(b / 1_073_741_824).toFixed(2)} GB`;
}

// ── Metadata pill ─────────────────────────────────────────────────────────────
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-muted-foreground/45">{label}</span>
      <span className="text-foreground/70 font-medium">{value}</span>
    </span>
  );
}

interface Props {
  db: string;
  table: string;
}

export default function TableView({ db, table }: Props) {
  const [info, setInfo] = useState<TableInfo | null>(null);

  useEffect(() => {
    setInfo(null);
    invoke<TableInfo>("get_table_info", { dbName: db, tableName: table })
      .then(setInfo)
      .catch(() => setInfo(null)); // non-critical — header just stays empty
  }, [db, table]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Breadcrumb + metadata bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-border bg-card/30">
        <div className="flex items-center gap-1.5 min-w-0">
          <RiTableLine className="size-3.5 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">{db}</span>
          <span className="text-muted-foreground/30 text-xs">/</span>
          <span className="text-xs font-semibold text-foreground">{table}</span>
        </div>

        {/* Metadata pills */}
        {info && (
          <div className="flex items-center gap-3 ml-2 text-[11px] divide-x divide-border/40">
            {info.engine && <Pill label="Engine" value={info.engine} />}
            <span className="pl-3">
              <Pill
                label="Rows"
                value={
                  info.row_estimate > 0
                    ? `~${info.row_estimate.toLocaleString()}`
                    : "0"
                }
              />
            </span>
            <span className="pl-3">
              <Pill
                label="Size"
                value={fmtBytes(info.data_size + info.index_size)}
              />
            </span>
            {info.collation && (
              <span className="pl-3 hidden xl:flex">
                <Pill label="Collation" value={info.collation} />
              </span>
            )}
            {info.create_time && (
              <span className="pl-3 hidden xl:flex">
                <Pill label="Created" value={info.create_time.split(" ")[0]} />
              </span>
            )}
          </div>
        )}

        {/* Loading shimmer */}
        {!info && (
          <div className="flex items-center gap-2 ml-2">
            {[56, 48, 52].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded bg-muted animate-pulse"
                style={{ width: w }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sub-tabs: Data | Structure | DDL ── */}
      <Tabs
        defaultValue="data"
        className="flex flex-col flex-1 overflow-hidden"
      >
        <TabsList className="shrink-0 h-8 bg-transparent rounded-none border-b border-border px-2 justify-start gap-1 w-full">
          {(["data", "structure", "ddl"] as const).map((v) => (
            <TabsTrigger
              key={v}
              value={v}
              className="h-6 text-xs px-3 rounded-md capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
            >
              {v === "ddl" ? "DDL" : v.charAt(0).toUpperCase() + v.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="data" className="flex-1 overflow-hidden mt-0">
          <DataGrid db={db} table={table} />
        </TabsContent>

        <TabsContent value="structure" className="flex-1 overflow-hidden mt-0">
          <StructureView db={db} table={table} />
        </TabsContent>

        <TabsContent value="ddl" className="flex-1 overflow-hidden mt-0">
          <DdlView db={db} table={table} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
