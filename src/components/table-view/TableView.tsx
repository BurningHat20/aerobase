import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiDatabase2Line, RiTableLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DataGrid from "./DataGrid";
import StructureView from "./StructureView";
import DdlView from "./DdlView";
import type { TableInfo } from "@/types";

function fmtBytes(b: number): string {
  if (b <= 0) return "—";
  if (b < 1_024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1_024).toFixed(1)} KB`;
  if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} MB`;
  return `${(b / 1_073_741_824).toFixed(2)} GB`;
}

type SubTab = "data" | "structure" | "ddl";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "data", label: "Data" },
  { id: "structure", label: "Structure" },
  { id: "ddl", label: "DDL" },
];

interface Props {
  db: string;
  table: string;
}

export default function TableView({ db, table }: Props) {
  const [active, setActive] = useState<SubTab>("data");
  const [info, setInfo] = useState<TableInfo | null>(null);

  useEffect(() => {
    setInfo(null);
    setActive("data");
    invoke<TableInfo>("get_table_info", { dbName: db, tableName: table })
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [db, table]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top chrome: breadcrumb + metadata ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-10 border-b border-border bg-card/50">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <RiDatabase2Line className="size-3 text-muted-foreground/50 shrink-0" />
          <span className="text-xs text-muted-foreground">{db}</span>
          <span className="text-muted-foreground/30">/</span>
          <RiTableLine className="size-3 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">{table}</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Metadata pills */}
        <div className="flex items-center gap-3 text-xs overflow-hidden">
          {info ? (
            <>
              {info.engine && (
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] px-1.5 font-mono font-medium gap-1 shrink-0"
                >
                  {info.engine}
                </Badge>
              )}
              <span className="text-muted-foreground shrink-0">
                <span className="font-medium text-foreground">
                  {info.row_estimate > 0
                    ? `~${info.row_estimate.toLocaleString()}`
                    : "0"}
                </span>
                {" rows"}
              </span>
              <span className="text-muted-foreground shrink-0">
                <span className="font-medium text-foreground">
                  {fmtBytes(info.data_size + info.index_size)}
                </span>
                {" total"}
              </span>
              {info.collation && (
                <span className="text-muted-foreground/60 font-mono text-[11px] truncate hidden lg:block">
                  {info.collation}
                </span>
              )}
            </>
          ) : (
            // Loading shimmer
            <div className="flex items-center gap-2">
              {[40, 60, 52].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 rounded bg-muted animate-pulse"
                  style={{ width: w }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sub-tabs (underline style, not pill style) ── */}
      <div className="shrink-0 flex items-end h-9 px-4 border-b border-border bg-background gap-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              "relative h-full px-3 text-xs font-medium transition-colors",
              "border-b-2 -mb-px",
              active === tab.id
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden">
        {active === "data" && <DataGrid db={db} table={table} />}
        {active === "structure" && <StructureView db={db} table={table} />}
        {active === "ddl" && <DdlView db={db} table={table} />}
      </div>
    </div>
  );
}
