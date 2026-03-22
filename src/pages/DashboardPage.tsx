import { useCallback, useMemo, useState } from "react";

import TopBar from "@/components/layout/TopBar";
import TabStrip from "@/components/layout/TabStrip";
import WelcomePane from "@/components/layout/WelcomePane";
import ResizableSidebar from "@/components/layout/ResizableSidebar";
import ServerInfoPanel from "@/components/layout/ServerInfoPanel";
import Sidebar from "@/components/sidebar/Sidebar";
import TableView from "@/components/table-view/TableView";
import SqlEditor from "@/components/table-view/SqlEditor";
import { useTabManager } from "@/hooks/useTabManager";
import { useKeyboard } from "@/hooks/useKeyboard";
import type { ConnectionInfo, Theme } from "@/types";

interface Props {
  connectionInfo: ConnectionInfo;
  databases: string[];
  onDisconnect: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export default function DashboardPage({
  connectionInfo,
  databases,
  onDisconnect,
  theme,
  toggleTheme,
}: Props) {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    openTableTab,
    openQueryTab,
    closeTab,
  } = useTabManager();

  const [serverPanelOpen, setServerPanelOpen] = useState(false);

  const handleNewQuery = useCallback(() => {
    openQueryTab(databases[0] ?? "");
  }, [databases, openQueryTab]);

  const shortcuts = useMemo(
    () => ({
      "ctrl+t": () => handleNewQuery(),
      "ctrl+w": () => {
        if (activeTabId) closeTab(activeTabId);
      },
    }),
    [handleNewQuery, activeTabId, closeTab]
  );

  useKeyboard(shortcuts);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TopBar
        connectionInfo={connectionInfo}
        onDisconnect={onDisconnect}
        onNewQuery={handleNewQuery}
        onOpenServerInfo={() => setServerPanelOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        <ResizableSidebar>
          <Sidebar
            connectionInfo={connectionInfo}
            databases={databases}
            onOpenTable={openTableTab}
            onOpenQuery={openQueryTab}
          />
        </ResizableSidebar>

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TabStrip
            tabs={tabs}
            activeTabId={activeTabId}
            onActivate={setActiveTabId}
            onClose={closeTab}
          />

          <div className="flex-1 overflow-hidden">
            {!activeTab ? (
              <WelcomePane dbCount={databases.length} />
            ) : activeTab.type === "table" ? (
              <TableView
                key={activeTab.id}
                db={activeTab.db}
                table={activeTab.table!}
              />
            ) : (
              <SqlEditor
                key={activeTab.id}
                db={activeTab.db}
                databases={databases}
              />
            )}
          </div>
        </div>
      </div>

      <ServerInfoPanel
        open={serverPanelOpen}
        onClose={() => setServerPanelOpen(false)}
        connectionInfo={connectionInfo}
      />
    </div>
  );
}
