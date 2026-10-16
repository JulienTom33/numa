import { afterEach, describe, expect, it, vi } from "vitest";
import { dismissConversionSheet, isConversionSheetDismissed } from "./discoveryPrompt";

describe("discoveryPrompt", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("n'est pas écartée par défaut puis le reste après dismiss", () => {
    expect(isConversionSheetDismissed()).toBe(false);
    dismissConversionSheet();
    expect(isConversionSheetDismissed()).toBe(true);
  });

  it("reste fonctionnel quand le stockage est indisponible", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(isConversionSheetDismissed()).toBe(false);
    expect(() => dismissConversionSheet()).not.toThrow();
  });
});
