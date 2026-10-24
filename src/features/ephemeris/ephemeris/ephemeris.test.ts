import { FunctionsHttpError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEphemerisPath,
  fetchEphemeris,
  toEphemerisErrorCode,
} from "./ephemeris";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const invoke = vi.mocked(supabase.functions.invoke);

const payload = {
  schemaVersion: 1,
  engine: { name: "astronomy-engine", version: "2.1.19" },
  range: { from: "2024-04-08", to: "2024-04-08", days: 1 },
  days: [],
  events: { ingresses: [], stations: [], moonPhases: [], eclipses: [] },
};

describe("ephemeris", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("construit le chemin pour un jour et pour une plage", () => {
    expect(buildEphemerisPath({ from: "2024-04-08" })).toBe(
      "ephemeris?date=2024-04-08",
    );
    expect(buildEphemerisPath({ from: "2024-04-08", to: "2024-04-08" })).toBe(
      "ephemeris?date=2024-04-08",
    );
    expect(buildEphemerisPath({ from: "2024-04-01", to: "2024-04-07" })).toBe(
      "ephemeris?from=2024-04-01&to=2024-04-07",
    );
  });

  it("renvoie l'éphéméride reçue", async () => {
    invoke.mockResolvedValue({ data: payload, error: null } as never);

    expect(await fetchEphemeris({ from: "2024-04-08" })).toEqual({
      data: payload,
      error: null,
    });
    expect(invoke).toHaveBeenCalledWith("ephemeris?date=2024-04-08", {
      method: "GET",
    });
  });

  it("traduit une erreur HTTP en code", async () => {
    const error = new FunctionsHttpError(
      new Response(JSON.stringify({ error: { code: "range_too_long" } }), {
        status: 400,
      }),
    );
    invoke.mockResolvedValue({ data: null, error } as never);

    expect(
      await fetchEphemeris({ from: "2024-01-01", to: "2024-06-01" }),
    ).toEqual({
      data: null,
      error: "range_too_long",
    });
  });

  it("signale une erreur réseau", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new Error("réseau"),
    } as never);

    expect((await fetchEphemeris({ from: "2024-04-08" })).error).toBe(
      "network_error",
    );
  });

  it("signale un corps d'erreur illisible ou un code inconnu", async () => {
    const unreadable = new FunctionsHttpError(
      new Response("pas du json", { status: 500 }),
    );
    invoke.mockResolvedValue({ data: null, error: unreadable } as never);

    expect((await fetchEphemeris({ from: "2024-04-08" })).error).toBe(
      "internal_error",
    );
    expect(toEphemerisErrorCode("autre")).toBe("internal_error");
    expect(toEphemerisErrorCode("invalid_date")).toBe("invalid_date");
  });

  it("refuse une réponse de schéma inattendu", async () => {
    invoke.mockResolvedValue({
      data: { schemaVersion: 2 },
      error: null,
    } as never);

    expect(await fetchEphemeris({ from: "2024-04-08" })).toEqual({
      data: null,
      error: "internal_error",
    });
  });
});
