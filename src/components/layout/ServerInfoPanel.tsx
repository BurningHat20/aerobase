import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  RiCloseLine,
  RiDatabase2Line,
  RiGlobalLine,
  RiLoader4Line,
  RiServerLine,
  RiShieldLine,
  RiUserLine,
} from "@remixicon/react";

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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const rows: InfoRow[] = info
    ? [
        {
          icon: <RiServerLine className="size-3.5 text-primary/70" />,
          label: "Version",
          value: info.version,
        },
        {
          icon: <RiGlobalLine className="size-3.5 text-sky-400/70" />,
          label: "Hostname",
          value: info.hostname,
        },
        {
          icon: <RiUserLine className="size-3.5 text-emerald-400/70" />,
          label: "Connected as",
          value: info.current_user,
        },
        {
          icon: <RiDatabase2Line className="size-3.5 text-amber-400/70" />,
          label: "Max connections",
          value: info.max_connections.toLocaleString(),
        },
        {
          icon: <RiShieldLine className="size-3.5 text-purple-400/70" />,
          label: "Charset",
          value: info.charset,
        },
        {
          icon: <RiShieldLine className="size-3.5 text-purple-400/70" />,
          label: "Collation",
          value: info.collation,
        },
      ]
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          "fixed top-9 right-0 bottom-0 z-50 w-72 bg-card border-l border-border shadow-2xl flex flex-col",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <RiServerLine className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Server Info
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        {/* Connection pill */}
        <div className="shrink-0 mx-3 mt-3 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-1">
            Active connection
          </p>
          <p className="text-xs font-mono text-foreground/80">
            {connectionInfo.user}@{connectionInfo.host}:{connectionInfo.port}
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 mt-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <RiLoader4Line className="size-4 animate-spin" />
              Loading…
            </div>
          )}

          {error && (
            <div className="mx-3 p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {!loading && !error && info && (
            <div className="px-3 pb-4 space-y-1">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors"
                >
                  <div className="shrink-0">{row.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold leading-none mb-0.5">
                      {row.label}
                    </p>
                    <p className="text-xs text-foreground/80 font-mono truncate">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
