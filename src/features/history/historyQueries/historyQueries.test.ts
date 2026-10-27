import { describe, expect, it, vi } from "vitest";
import { CodedQueryError } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { historyErrorCode, historyQueryKeys } from "./historyQueries";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: { from: vi.fn() } }));

describe("historyErrorCode", () => {
  it("conserve un code connu", () => {
    expect(historyErrorCode(new CodedQueryError("conversation_not_found"))).toBe("conversation_not_found");
  });

  it("retombe sur internal_error pour une erreur inconnue", () => {
    expect(historyErrorCode(new CodedQueryError("autre"))).toBe("internal_error");
    expect(historyErrorCode(new Error("x"))).toBe("internal_error");
  });
});

describe("historyQueryKeys", () => {
  it("isole les clés par utilisateur et conversation", () => {
    expect(historyQueryKeys.conversations("u1")).not.toEqual(historyQueryKeys.conversations("u2"));
    expect(historyQueryKeys.conversation("u1", "c1")).not.toEqual(historyQueryKeys.conversation("u1", "c2"));
  });
});
