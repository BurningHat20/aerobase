import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import Toaster from "@/components/layout/Toaster";
import { clearSession, loadSession, saveSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import type { ConnectionInfo } from "@/types";

type AppState =
  | { status: "checking" }
  | { status: "login" }
  | { status: "connected"; connectionInfo: ConnectionInfo; databases: string[] };

export default function App() {
  const [appState, setAppState] = useState<AppState>({ status: "checking" });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const stored = loadSession();
    if (!stored) { setAppState({ status: "login" }); return; }

    invoke("ping_db")
      .then(() =>
        setAppState({
          status: "connected",
          connectionInfo: stored.connectionInfo,
          databases: stored.databases,
        })
      )
      .catch(() => {
        clearSession();
        setAppState({ status: "login" });
      });
  }, []);

  const handleConnect = useCallback((info: ConnectionInfo, dbs: string[]) => {
    saveSession(info, dbs);
    setAppState({ status: "connected", connectionInfo: info, databases: dbs });
  }, []);

  const handleDisconnect = useCallback(() => {
    invoke("disconnect_db").catch(console.error);
    clearSession();
    setAppState({ status: "login" });
  }, []);

  if (appState.status === "checking") {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {appState.status === "connected" ? (
        <DashboardPage
          connectionInfo={appState.connectionInfo}
          databases={appState.databases}
          onDisconnect={handleDisconnect}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <LoginPage
          onConnect={handleConnect}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      <Toaster />
    </>
  );
}