import { useCallback, useState } from "react";
import type { OpenTab } from "@/types";

export function useTabManager() {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  /** Open or focus a table browser tab. One tab per db+table. */
  const openTableTab = useCallback((db: string, table: string) => {
    const id = `table:${db}:${table}`;
    setTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, type: "table", db, table, label: table }];
    });
    setActiveTabId(id);
  }, []);

  /** Always opens a fresh query tab (multiple allowed). */
  const openQueryTab = useCallback((db: string) => {
    const id = `query:${Date.now()}`;
    setTabs((prev) => [
      ...prev,
      { id, type: "query", db, label: "SQL Editor" },
    ]);
    setActiveTabId(id);
  }, []);

  /** Close a tab and activate an adjacent one. Uses functional updates to
   *  avoid stale closure issues — no dependency array needed. */
  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      setActiveTabId((curr) => {
        if (curr !== id) return curr;
        const idx = prev.findIndex((t) => t.id === id);
        return next[Math.min(idx, next.length - 1)]?.id ?? null;
      });
      return next;
    });
  }, []);

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    openTableTab,
    openQueryTab,
    closeTab,
  };
}
