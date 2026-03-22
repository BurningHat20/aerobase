import { useEffect } from "react";

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Global keyboard shortcut hook.
 * Keys are lowercase strings like "ctrl+t", "ctrl+w", "ctrl+shift+p".
 * Does not trigger when focus is inside a textarea or input (except for
 * shortcuts explicitly flagged with `allowInInput`).
 */
export function useKeyboard(
  shortcuts: ShortcutMap,
  opts: { allowInInput?: boolean } = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't steal typing shortcuts from text inputs unless explicitly allowed
      if (!opts.allowInInput) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "textarea" || tag === "input") return;
      }

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");
      parts.push(e.key.toLowerCase());

      const combo = parts.join("+");
      const handler = shortcuts[combo];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, opts.allowInInput]);
}
