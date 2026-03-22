import { toast } from "sonner";

/**
 * Copies text to the system clipboard and fires a sonner toast.
 * Works inside Tauri's webview (navigator.clipboard is available).
 */
export async function copyToClipboard(
  text: string,
  label = "Copied to clipboard"
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label, {
      duration: 1500,
      // Compact style so it doesn't dominate the UI
      style: { padding: "8px 12px", fontSize: "12px" },
    });
  } catch {
    toast.error("Copy failed — clipboard unavailable");
  }
}

// ── Table export helpers ───────────────────────────────────────────────────────

/** Converts grid data to RFC 4180 CSV. Handles commas, quotes, newlines. */
export function toCSV(columns: string[], rows: string[][]): string {
  const esc = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const header = columns.map(esc).join(",");
  const body = rows.map((r) => r.map(esc).join(",")).join("\n");
  return body ? `${header}\n${body}` : header;
}

/** Converts grid data to a pretty-printed JSON array of objects. */
export function toJSON(columns: string[], rows: string[][]): string {
  const objs = rows.map((r) =>
    Object.fromEntries(
      columns.map((col, i) => [col, r[i] === "NULL" ? null : r[i]])
    )
  );
  return JSON.stringify(objs, null, 2);
}

/**
 * Builds a MySQL INSERT statement for a single row.
 * All values are single-quoted; NULLs are unquoted.
 */
export function toInsert(
  tableName: string,
  columns: string[],
  row: string[]
): string {
  const escId = (s: string) => `\`${s.replace(/`/g, "``")}\``;
  const cols = columns.map(escId).join(", ");
  const vals = row
    .map((v) => (v === "NULL" ? "NULL" : `'${v.replace(/'/g, "\\'")}'`))
    .join(", ");
  return `INSERT INTO ${escId(tableName)} (${cols}) VALUES (${vals});`;
}
