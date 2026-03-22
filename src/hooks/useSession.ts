import type { ConnectionInfo } from "@/types";

const KEY = "aerobase_session";

interface StoredSession {
  connectionInfo: ConnectionInfo;
  databases: string[];
}

/** Persist session info to sessionStorage (survives F5, lost on tab/window close). */
export function saveSession(info: ConnectionInfo, databases: string[]): void {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ connectionInfo: info, databases })
    );
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — silent fail
  }
}

/** Remove session — call on intentional disconnect. */
export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Read stored session without side effects. Returns null if nothing saved. */
export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Basic shape guard
    if (!parsed?.connectionInfo?.host || !Array.isArray(parsed?.databases))
      return null;
    return parsed;
  } catch {
    return null;
  }
}
