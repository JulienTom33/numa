import { describe, expect, it } from "vitest";
import { loadStatus } from "./loadStatus";

describe("loadStatus", () => {
  it("est ready dès qu'une donnée est disponible, même pendant un rafraîchissement", () => {
    expect(loadStatus({ isSuccess: true, isError: false, isFetching: true })).toBe("ready");
  });

  it("est error seulement quand aucune nouvelle tentative n'est en cours", () => {
    expect(loadStatus({ isSuccess: false, isError: true, isFetching: false })).toBe("error");
    expect(loadStatus({ isSuccess: false, isError: true, isFetching: true })).toBe("loading");
  });

  it("est loading au premier chargement", () => {
    expect(loadStatus({ isSuccess: false, isError: false, isFetching: true })).toBe("loading");
  });
});
