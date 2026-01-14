"use client";

import { useEffect, useCallback } from "react";

type KeyHandler = (event: KeyboardEvent) => void;

interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useHotkey(
  key: string,
  handler: KeyHandler,
  options: HotkeyOptions = {},
) {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const parts = key.toLowerCase().split("+");
      const targetKey = parts[parts.length - 1];
      const requiresCtrl = parts.includes("ctrl") || parts.includes("cmd");
      const requiresShift = parts.includes("shift");
      const requiresAlt = parts.includes("alt");

      const ctrlPressed = event.ctrlKey || event.metaKey;
      const shiftPressed = event.shiftKey;
      const altPressed = event.altKey;

      if (requiresCtrl !== ctrlPressed) return;
      if (requiresShift !== shiftPressed) return;
      if (requiresAlt !== altPressed) return;

      if (event.key.toLowerCase() === targetKey) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler(event);
      }
    },
    [key, handler, preventDefault],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export function useEscapeKey(handler: KeyHandler, enabled = true) {
  useHotkey("escape", handler, { enabled, preventDefault: false });
}
