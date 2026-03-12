import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAndClearScrollPosition,
  saveScrollPosition,
} from "./scroll-restore";

const SCROLL_RESTORE_KEY = "scrollRestore";

type SessionStorageStub = Pick<Storage, "getItem" | "setItem" | "removeItem">;

describe("scroll-restore", () => {
  let sessionStore: Record<string, string> = {};
  let sessionStorageStub: SessionStorageStub;

  beforeEach(() => {
    sessionStore = {};
    sessionStorageStub = {
      getItem: (key: string) => sessionStore[key] ?? null,
      setItem: (key: string, value: string) => {
        sessionStore[key] = value;
      },
      removeItem: (key: string) => {
        delete sessionStore[key];
      },
    };
    vi.stubGlobal("sessionStorage", sessionStorageStub);
    vi.stubGlobal("window", { scrollY: 100 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("saveScrollPosition", () => {
    it("writes path and scrollY to sessionStorage", () => {
      vi.stubGlobal("window", { scrollY: 250 });
      saveScrollPosition("/feed");
      const stored = sessionStore[SCROLL_RESTORE_KEY];
      expect(stored).toBeDefined();
      expect(JSON.parse(stored)).toEqual({ path: "/feed", y: 250 });
    });

    it("is a no-op when window is undefined", () => {
      vi.stubGlobal("window", undefined);
      saveScrollPosition("/feed");
      expect(sessionStore[SCROLL_RESTORE_KEY]).toBeUndefined();
    });

    it("swallows storage errors", () => {
      vi.spyOn(sessionStorageStub, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => saveScrollPosition("/feed")).not.toThrow();
    });
  });

  describe("getAndClearScrollPosition", () => {
    it("returns null when no saved value exists", () => {
      expect(getAndClearScrollPosition("/feed")).toBeNull();
    });

    it("returns null when saved path does not match", () => {
      sessionStore[SCROLL_RESTORE_KEY] = JSON.stringify({
        path: "/other",
        y: 42,
      });
      expect(getAndClearScrollPosition("/feed")).toBeNull();
    });

    it("returns saved y and removes storage item when path matches", () => {
      sessionStore[SCROLL_RESTORE_KEY] = JSON.stringify({
        path: "/feed",
        y: 42,
      });
      expect(getAndClearScrollPosition("/feed")).toBe(42);
      expect(sessionStore[SCROLL_RESTORE_KEY]).toBeUndefined();
    });

    it("returns null on invalid JSON", () => {
      sessionStore[SCROLL_RESTORE_KEY] = "not valid json{{{";
      expect(getAndClearScrollPosition("/feed")).toBeNull();
    });

    it("returns null when window is undefined", () => {
      sessionStore[SCROLL_RESTORE_KEY] = JSON.stringify({
        path: "/feed",
        y: 42,
      });
      vi.stubGlobal("window", undefined);
      expect(getAndClearScrollPosition("/feed")).toBeNull();
    });
  });
});
