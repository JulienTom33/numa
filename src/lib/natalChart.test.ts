import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchComputedAscendant } from "./natalChart";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const invoke = vi.mocked(supabase.functions.invoke);

function httpError(code: string): FunctionsHttpError {
  return new FunctionsHttpError(new Response(JSON.stringify({ error: { code, message: code } }), { status: 400 }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchComputedAscendant", () => {
  it("renvoie le signe, le degré et la confiance du thème", async () => {
    invoke.mockResolvedValue({
      data: {
        chart: {
          confidence: "high",
          angles: { ascendant: { sign: "scorpio", degreeInSign: 14.6, longitude: 224.6 } },
        },
      },
      error: null,
    });

    await expect(fetchComputedAscendant()).resolves.toEqual({
      ascendant: { sign: "scorpio", degreeInSign: 14.6 },
      confidence: "high",
      error: null,
    });
    expect(invoke).toHaveBeenCalledWith("natal-chart", { method: "GET" });
  });

  it("renvoie un ascendant nul quand le thème n'en contient pas", async () => {
    invoke.mockResolvedValue({ data: { chart: { confidence: "low", angles: null } }, error: null });

    await expect(fetchComputedAscendant()).resolves.toEqual({ ascendant: null, confidence: "low", error: null });
  });

  it("ignore un signe inconnu", async () => {
    invoke.mockResolvedValue({
      data: { chart: { angles: { ascendant: { sign: "ophiuchus", degreeInSign: 3 } } } },
      error: null,
    });

    await expect(fetchComputedAscendant()).resolves.toMatchObject({ ascendant: null, confidence: null, error: null });
  });

  it("convertit une erreur HTTP de la fonction en code", async () => {
    invoke.mockResolvedValue({ data: null, error: httpError("birth_data_not_found") });

    await expect(fetchComputedAscendant()).resolves.toMatchObject({ error: "birth_data_not_found" });
  });

  it("replie un code d'erreur inconnu sur internal_error", async () => {
    invoke.mockResolvedValue({ data: null, error: httpError("weird") });

    await expect(fetchComputedAscendant()).resolves.toMatchObject({ error: "internal_error" });
  });

  it("signale une erreur réseau", async () => {
    invoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(new Error("offline")) });

    await expect(fetchComputedAscendant()).resolves.toMatchObject({ error: "network_error" });
  });

  it("signale une réponse sans thème", async () => {
    invoke.mockResolvedValue({ data: {}, error: null });

    await expect(fetchComputedAscendant()).resolves.toMatchObject({ error: "internal_error" });
  });
});
