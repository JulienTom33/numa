import { FunctionsHttpError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { fetchHoroscope, localIsoDate, parseHoroscope } from "./horoscope";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const PAYLOAD = {
  horoscope: {
    date: "2026-10-27",
    sections: { general: "G", relations: "R", work: "W", energy: "E" },
    basis: {
      confidence: "high",
      aspects: [
        { transitBody: "mars", natalPoint: "sun", type: "square", orb: 1.2 },
        { transitBody: "unknown", natalPoint: "sun", type: "square", orb: 1 },
      ],
      warnings: ["unknown_time", "other"],
    },
    promptVersion: "sidera-horoscope-v1",
  },
};

function httpError(status: number, code: string): FunctionsHttpError {
  return new FunctionsHttpError(new Response(JSON.stringify({ error: { code } }), { status }));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseHoroscope", () => {
  it("garde les quatre sections et ne retient que les repères connus", () => {
    expect(parseHoroscope(PAYLOAD)).toEqual({
      date: "2026-10-27",
      sections: { general: "G", relations: "R", work: "W", energy: "E" },
      basis: {
        confidence: "high",
        aspects: [{ transitBody: "mars", natalPoint: "sun", type: "square", orb: 1.2 }],
        warnings: ["unknown_time"],
      },
    });
  });

  it("refuse une réponse incomplète", () => {
    expect(parseHoroscope(null)).toBeNull();
    expect(parseHoroscope({ horoscope: { date: "2026-10-27", sections: { general: "G" } } })).toBeNull();
    expect(parseHoroscope({ horoscope: { sections: PAYLOAD.horoscope.sections } })).toBeNull();
  });

  it("tolère un fondement absent", () => {
    const { date, sections } = PAYLOAD.horoscope;

    expect(parseHoroscope({ horoscope: { date, sections } })?.basis).toEqual({ confidence: null, aspects: [], warnings: [] });
  });
});

describe("fetchHoroscope", () => {
  it("appelle la fonction avec la date du jour", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: PAYLOAD, error: null } as never);

    const result = await fetchHoroscope("2026-10-27");

    expect(result.error).toBeNull();
    expect(result.data?.sections.work).toBe("W");
    expect(supabase.functions.invoke).toHaveBeenCalledWith("horoscope", { body: { date: "2026-10-27" } });
  });

  it("traduit les codes d'erreur du serveur", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: httpError(503, "ai_unavailable"),
    } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: httpError(404, "birth_data_not_found"),
    } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: httpError(500, "surprise"),
    } as never);

    expect((await fetchHoroscope("2026-10-27")).error).toBe("ai_unavailable");
    expect((await fetchHoroscope("2026-10-27")).error).toBe("birth_data_not_found");
    expect((await fetchHoroscope("2026-10-27")).error).toBe("network_error");
  });

  it("signale une erreur réseau ou une réponse illisible", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: null, error: new Error("offline") } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { horoscope: 1 }, error: null } as never);

    expect((await fetchHoroscope("2026-10-27")).error).toBe("network_error");
    expect((await fetchHoroscope("2026-10-27")).error).toBe("network_error");
  });
});

describe("localIsoDate", () => {
  it("formate la date locale sur dix caractères", () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
