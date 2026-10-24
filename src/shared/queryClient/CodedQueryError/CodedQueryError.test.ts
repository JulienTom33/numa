import { describe, expect, it } from "vitest";
import { CodedQueryError, errorCodeOf, unwrapResult } from "./CodedQueryError";

type Code = "network_error" | "internal_error";
const KNOWN: readonly Code[] = ["network_error", "internal_error"];

describe("unwrapResult", () => {
  it("renvoie la donnée quand il n'y a pas d'erreur", () => {
    expect(unwrapResult({ a: 1 }, null)).toEqual({ a: 1 });
  });

  it("lève le code d'erreur du service", () => {
    expect(() => unwrapResult(null, "network_error")).toThrow(expect.objectContaining({ code: "network_error" }));
  });

  it("lève internal_error quand ni donnée ni erreur n'arrivent", () => {
    expect(() => unwrapResult(null, null)).toThrow(expect.objectContaining({ code: "internal_error" }));
  });
});

describe("errorCodeOf", () => {
  it("retrouve un code connu", () => {
    expect(errorCodeOf(new CodedQueryError("network_error"), KNOWN, "internal_error")).toBe("network_error");
  });

  it("retombe sur le code par défaut pour un code inconnu ou une erreur quelconque", () => {
    expect(errorCodeOf(new CodedQueryError("autre"), KNOWN, "internal_error")).toBe("internal_error");
    expect(errorCodeOf(new Error("x"), KNOWN, "internal_error")).toBe("internal_error");
    expect(errorCodeOf(null, KNOWN, "internal_error")).toBe("internal_error");
  });
});
