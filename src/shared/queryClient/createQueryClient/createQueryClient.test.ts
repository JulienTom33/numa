import { describe, expect, it } from "vitest";
import { CodedQueryError } from "../CodedQueryError/CodedQueryError";
import { createQueryClient, shouldRetry } from "./createQueryClient";

describe("shouldRetry", () => {
  it("réessaie seulement les erreurs réseau, deux fois au plus", () => {
    const network = new CodedQueryError("network_error");
    expect(shouldRetry(0, network)).toBe(true);
    expect(shouldRetry(1, network)).toBe(true);
    expect(shouldRetry(2, network)).toBe(false);
  });

  it("ne réessaie pas une erreur métier", () => {
    expect(shouldRetry(0, new CodedQueryError("birth_data_not_found"))).toBe(false);
    expect(shouldRetry(0, new Error("x"))).toBe(false);
  });
});

describe("createQueryClient", () => {
  it("crée un client indépendant à chaque appel", () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
