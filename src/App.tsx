import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import Toaster from "@/components/layout/Toaster";
import { clearSession, loadSession, saveSession } from "@/hooks/useSession";
import type { ConnectionInfo } from "@/types";

type AppState =
  | { status: "checking" } // verifying pool after a webview reload
  | { status: "login" } // show login page
  | {
      status: "connected";
      connectionInfo: ConnectionInfo;
      databases: string[];
    };

export default function App() {
  const [appState, setAppState] = useState<AppState>({ status: "checking" });

  // ── On mount: try to restore session ──────────────────────────────────────
  useEffect(() => {
    const stored = loadSession();

    if (!stored) {
      setAppState({ status: "login" });
      return;
    }

    // The Rust pool survives a webview reload — ping it before trusting the session
    invoke("ping_db")
      .then(() => {
        setAppState({
          status: "connected",
          connectionInfo: stored.connectionInfo,
          databases: stored.databases,
        });
      })
      .catch(() => {
        // Pool is gone (app was fully restarted) — show login
        clearSession();
        setAppState({ status: "login" });
      });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleConnect = useCallback((info: ConnectionInfo, dbs: string[]) => {
    saveSession(info, dbs);
    setAppState({ status: "connected", connectionInfo: info, databases: dbs });
  }, []);

  const handleDisconnect = useCallback(() => {
    invoke("disconnect_db").catch(console.error);
    clearSession();
    setAppState({ status: "login" });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (appState.status === "checking") {
    // Intentionally minimal — renders for <50ms before the ping resolves
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
        />
      ) : (
        <LoginPage onConnect={handleConnect} />
      )}
      <Toaster />
    </>
  );
}
