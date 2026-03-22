import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RiAlertLine, RiFileCopyLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard } from "@/hooks/useClipboard";
import { useTheme } from "@/hooks/useTheme";
import CodeEditor from "@/components/editor/CodeEditor";

interface Props {
  db: string;
  table: string;
}

export default function DdlView({ db, table }: Props) {
  const [ddl, setDdl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();

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
            className="h-4 rounded-sm"
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
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Floating copy button */}
      <div className="absolute top-2 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1 bg-card/80 backdrop-blur-sm border-border/40"
          onClick={() => copyToClipboard(ddl, "DDL copied")}
        >
          <RiFileCopyLine className="size-3" />
          Copy
        </Button>
      </div>

      {/* CodeMirror editor (read-only) */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          value={ddl}
          readOnly
          isDark={theme === "dark"}
        />
      </div>
    </div>
  );
}
