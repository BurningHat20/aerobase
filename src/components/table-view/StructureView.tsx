import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiAlertLine } from "@remixicon/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ColumnInfo } from "@/types";

function KeyBadge({ k }: { k: string }) {
  if (!k) return null;
  const map: Record<string, string> = {
    PRI: "bg-foreground/8 text-foreground/70 border-foreground/10",
    UNI: "bg-foreground/5 text-foreground/50 border-foreground/8",
    MUL: "bg-foreground/5 text-muted-foreground border-foreground/8",
  };
  return (
    <span
      className={`inline-flex items-center h-5 px-1.5 rounded text-[10px] font-bold border font-mono tracking-wide ${
        map[k] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {k}
    </span>
  );
}

function TypeLabel({ type }: { type: string }) {
  return (
    <span className="font-mono text-[11px] font-medium text-foreground/60">{type}</span>
  );
}

interface Props {
  db: string;
  table: string;
}

export default function StructureView({ db, table }: Props) {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setColumns([]);
    invoke<ColumnInfo[]>("get_table_structure", {
      dbName: db,
      tableName: table,
    })
      .then(setColumns)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [db, table]);

  const columnDefs = useMemo<ColumnDef<ColumnInfo>[]>(
    () => [
      {
        id: "num",
        header: "#",
        size: 44,
        cell: ({ row }) => (
          <span className="text-muted-foreground/20 text-[11px] tabular-nums">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "field",
        header: "Field",
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-foreground text-xs">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "type_name",
        header: "Type",
        size: 150,
        cell: ({ getValue }) => <TypeLabel type={getValue() as string} />,
      },
      {
        accessorKey: "nullable",
        header: "Null",
        size: 65,
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-normal">
              YES
            </Badge>
          ) : (
            <span className="text-muted-foreground/25 text-[11px]">NO</span>
          ),
      },
      {
        accessorKey: "key_type",
        header: "Key",
        size: 65,
        cell: ({ getValue }) => <KeyBadge k={getValue() as string} />,
      },
      {
        accessorKey: "default_val",
        header: "Default",
        size: 130,
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          if (v === null)
            return <span className="text-muted-foreground/20 italic text-[11px]">NULL</span>;
          return (
            <span className="font-mono text-[11px] text-muted-foreground">
              {v || <span className="text-muted-foreground/15">--</span>}
            </span>
          );
        },
      },
      {
        accessorKey: "extra",
        header: "Extra",
        size: 150,
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return (
            <span className="text-[11px] text-muted-foreground/40">
              {v || <span className="text-muted-foreground/12">--</span>}
            </span>
          );
        },
      },
      {
        accessorKey: "comment",
        header: "Comment",
        size: 180,
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return (
            <span className="text-[11px] text-muted-foreground/35">
              {v || <span className="text-muted-foreground/12">--</span>}
            </span>
          );
        },
      },
    ],
    []
  );

  const tableInstance = useReactTable({
    data: columns,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading)
    return (
      <div className="p-5 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-full rounded-sm"
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="flex items-start gap-3 m-5 p-4 rounded-lg text-sm bg-destructive/8 text-destructive border border-destructive/20">
        <RiAlertLine className="size-4 shrink-0 mt-0.5" />
        {error}
      </div>
    );

  return (
    <ScrollArea className="h-full">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10">
          {tableInstance.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-card border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-r border-border last:border-r-0"
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {tableInstance.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-b border-border/50 transition-colors hover:bg-accent/40 ${
                i % 2 !== 0 ? "bg-card/30" : ""
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-3 py-2 border-r border-border/30 last:border-r-0"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
