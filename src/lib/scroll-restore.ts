const SCROLL_RESTORE_KEY = "scrollRestore";

export type ScrollRestoreData = {
  path: string;
  y: number;
};

export function saveScrollPosition(path: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SCROLL_RESTORE_KEY,
      JSON.stringify({ path, y: window.scrollY })
    );
  } catch {
    // Ignore storage errors (e.g. private browsing)
  }
}

export function getAndClearScrollPosition(path: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SCROLL_RESTORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ScrollRestoreData;
    if (data.path !== path) return null;
    sessionStorage.removeItem(SCROLL_RESTORE_KEY);
    return data.y;
  } catch {
    return null;
  }
}
