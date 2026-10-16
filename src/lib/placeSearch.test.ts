import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { searchPlaces, type PlaceSuggestion } from "./placeSearch";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const PARIS: PlaceSuggestion = {
  id: "2988507",
  name: "Paris",
  region: "Île-de-France",
  country: "France",
  countryCode: "FR",
  label: "Paris, Île-de-France, France",
  latitude: 48.85341,
  longitude: 2.3488,
  timezone: "Europe/Paris",
};

const invoke = vi.mocked(supabase.functions.invoke);

function httpError(status: number, body: unknown): FunctionsHttpError {
  return new FunctionsHttpError(new Response(JSON.stringify(body), { status }));
}

describe("searchPlaces", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not call the function for fewer than two characters", async () => {
    await expect(searchPlaces(" P ")).resolves.toEqual({ places: [], error: null });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("invokes the geocode function with the trimmed query and returns places", async () => {
    invoke.mockResolvedValue({ data: { places: [PARIS] }, error: null } as never);
    const controller = new AbortController();

    const result = await searchPlaces("  Paris ", { signal: controller.signal, limit: 5 });

    expect(result).toEqual({ places: [PARIS], error: null });
    expect(invoke).toHaveBeenCalledWith(
      "geocode",
      expect.objectContaining({ body: { query: "Paris", limit: 5 }, signal: controller.signal }),
    );
  });

  it("returns an empty list when nothing matches", async () => {
    invoke.mockResolvedValue({ data: { places: [] }, error: null } as never);

    await expect(searchPlaces("zzqxw")).resolves.toEqual({ places: [], error: null });
    expect(invoke).toHaveBeenCalledWith("geocode", expect.objectContaining({ body: { query: "zzqxw" } }));
  });

  it.each([
    [502, "provider_unavailable", "provider_unavailable"],
    [504, "provider_timeout", "provider_timeout"],
    [400, "invalid_query", "invalid_query"],
    [401, "invalid_token", "unauthenticated"],
    [500, "internal_error", "unknown_error"],
  ])("maps a %i %s server error to %s", async (status, serverCode, expected) => {
    invoke.mockResolvedValue({
      data: null,
      error: httpError(status, { error: { code: serverCode, message: "…" } }),
    } as never);

    const { places, error } = await searchPlaces("Paris");

    expect(places).toBeNull();
    expect(error).toEqual({ code: expected });
  });

  it("maps an unreadable error body to unknown_error", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(new Response("<html>", { status: 502 })),
    } as never);

    expect((await searchPlaces("Paris")).error?.code).toBe("unknown_error");
  });

  it("maps a network failure to network_error", async () => {
    invoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(new TypeError("offline")) } as never);

    expect((await searchPlaces("Paris")).error?.code).toBe("network_error");
  });

  it("maps a relay failure to unknown_error", async () => {
    invoke.mockResolvedValue({ data: null, error: new FunctionsRelayError({}) } as never);

    expect((await searchPlaces("Paris")).error?.code).toBe("unknown_error");
  });

  it("reports a search cancelled by the caller", async () => {
    const controller = new AbortController();
    invoke.mockImplementation(() => {
      controller.abort();
      return Promise.resolve({ data: null, error: new FunctionsFetchError(new DOMException("", "AbortError")) } as never);
    });

    expect((await searchPlaces("Paris", { signal: controller.signal })).error?.code).toBe("aborted");
  });

  it("rejects a malformed response", async () => {
    invoke.mockResolvedValue({ data: { places: [{ id: 1 }] }, error: null } as never);

    expect((await searchPlaces("Paris")).error?.code).toBe("unknown_error");
  });
});
