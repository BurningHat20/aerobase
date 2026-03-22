import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiDatabase2Line, RiTableLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DataGrid from "./DataGrid";
import StructureView from "./StructureView";
import DdlView from "./DdlView";
import type { TableInfo } from "@/types";

function fmtBytes(b: number): string {
  if (b <= 0) return "--";
  if (b < 1_024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1_024).toFixed(1)} KB`;
  if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} MB`;
  return `${(b / 1_073_741_824).toFixed(2)} GB`;
}

type SubTab = "data" | "structure" | "ddl";

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
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-10 border-b border-border">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <RiDatabase2Line className="size-3.5 text-muted-foreground/30 shrink-0" />
          <span className="text-xs text-muted-foreground font-mono">{db}</span>
          <span className="text-muted-foreground/15 mx-0.5">/</span>
          <RiTableLine className="size-3.5 text-foreground/50 shrink-0" />
          <span className="text-xs font-semibold text-foreground font-mono">{table}</span>
        </div>

        {/* Metadata */}
        {info && (
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground/40">
            {info.engine && (
              <Badge
                variant="secondary"
                className="h-5 text-[10px] px-1.5 font-mono font-normal"
              >
                {info.engine}
              </Badge>
            )}
            <span className="tabular-nums">
              {info.row_estimate > 0
                ? `~${info.row_estimate.toLocaleString()} rows`
                : "0 rows"}
            </span>
            <span className="tabular-nums">
              {fmtBytes(info.data_size + info.index_size)}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Sub-tabs */}
        <ToggleGroup
          type="single"
          value={active}
          onValueChange={(v) => v && setActive(v as SubTab)}
          className="h-7"
        >
          <ToggleGroupItem value="data" className="h-7 px-3 text-xs rounded-md">
            Data
          </ToggleGroupItem>
          <ToggleGroupItem value="structure" className="h-7 px-3 text-xs rounded-md">
            Structure
          </ToggleGroupItem>
          <ToggleGroupItem value="ddl" className="h-7 px-3 text-xs rounded-md">
            DDL
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {active === "data" && <DataGrid db={db} table={table} />}
        {active === "structure" && <StructureView db={db} table={table} />}
        {active === "ddl" && <DdlView db={db} table={table} />}
      </div>
    </div>
  );
}
