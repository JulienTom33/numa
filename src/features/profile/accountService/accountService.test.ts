import { FunctionsHttpError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { deleteAccount, toAccountErrorCode } from "./accountService";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const invoke = vi.mocked(supabase.functions.invoke);

beforeEach(() => {
  invoke.mockReset();
});

describe("accountService", () => {
  it("appelle la fonction delete-account en POST", async () => {
    invoke.mockResolvedValue({ data: { deleted: true }, error: null } as never);

    expect(await deleteAccount()).toEqual({ error: null });
    expect(invoke).toHaveBeenCalledWith("delete-account", { method: "POST" });
  });

  it("traduit un code d'erreur HTTP connu", async () => {
    const error = new FunctionsHttpError(
      new Response(JSON.stringify({ error: { code: "rate_limit_exceeded" } }), { status: 429 }),
    );
    invoke.mockResolvedValue({ data: null, error } as never);

    expect(await deleteAccount()).toEqual({ error: "rate_limit_exceeded" });
  });

  it("signale une erreur réseau", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("réseau") } as never);

    expect(await deleteAccount()).toEqual({ error: "network_error" });
  });

  it("signale un corps d'erreur illisible", async () => {
    const error = new FunctionsHttpError(new Response("pas du json", { status: 500 }));
    invoke.mockResolvedValue({ data: null, error } as never);

    expect(await deleteAccount()).toEqual({ error: "internal_error" });
  });

  it("ramène un code inconnu à internal_error", () => {
    expect(toAccountErrorCode("autre")).toBe("internal_error");
    expect(toAccountErrorCode("delete_failed")).toBe("delete_failed");
  });
});
