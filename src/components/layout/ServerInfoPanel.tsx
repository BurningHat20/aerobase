import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiDatabase2Line,
  RiGlobalLine,
  RiLoader4Line,
  RiServerLine,
  RiShieldLine,
  RiUserLine,
} from "@remixicon/react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConnectionInfo, ServerInfo } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  connectionInfo: ConnectionInfo;
}

interface InfoRow {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function ServerInfoPanel({
  open,
  onClose,
  connectionInfo,
}: Props) {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    invoke<ServerInfo>("get_server_info")
      .then(setInfo)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [open]);

  const rows: InfoRow[] = info
    ? [
        {
          icon: <RiServerLine className="size-3.5 text-primary" />,
          label: "Version",
          value: info.version,
        },
        {
          icon: <RiGlobalLine className="size-3.5 text-info" />,
          label: "Hostname",
          value: info.hostname,
        },
        {
          icon: <RiUserLine className="size-3.5 text-success" />,
          label: "Connected as",
          value: info.current_user,
        },
        {
          icon: <RiDatabase2Line className="size-3.5 text-warning" />,
          label: "Max connections",
          value: info.max_connections.toLocaleString(),
        },
        {
          icon: <RiShieldLine className="size-3.5 text-chart-4" />,
          label: "Charset",
          value: info.charset,
        },
        {
          icon: <RiShieldLine className="size-3.5 text-chart-4" />,
          label: "Collation",
          value: info.collation,
        },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <RiServerLine className="size-4 text-primary" />
            Server Info
          </SheetTitle>
        </SheetHeader>

        {/* Connection pill */}
        <div className="shrink-0 mx-3 mt-3 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-0.5">
            Connection
          </p>
          <p className="text-[11px] font-mono text-foreground/80">
            {connectionInfo.user}@{connectionInfo.host}:{connectionInfo.port}
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 mt-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <RiLoader4Line className="size-4 animate-spin" />
              Loading...
            </div>
          )}

          {error && (
            <div className="mx-3 p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {!loading && !error && info && (
            <div className="px-3 pb-4 space-y-0.5">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors"
                >
                  <div className="shrink-0">{row.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-semibold leading-none mb-1">
                      {row.label}
                    </p>
                    <p className="text-[11px] text-foreground/80 font-mono truncate">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
