import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { fetchMonthlyHoroscope, parseMonthlyHoroscope } from "./monthlyHoroscope";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const PAYLOAD = {
  horoscope: {
    monthStart: "2026-10-01",
    monthEnd: "2026-10-31",
    sections: { general: "G", relations: "R", work: "W", energy: "E" },
    fallback: false,
    basis: {
      ascendantKnown: true,
      events: {
        ingresses: [{ body: "mars", to: "leo", at: "2026-10-30T10:00:00Z" }],
        stations: [],
        moonPhases: [{ phase: "full_moon", at: "2026-10-26T04:00:00Z" }],
        eclipses: [{ body: "lunar", kind: "total", at: "2026-10-28T00:00:00Z" }, { body: 1 }],
      },
      aspects: [
        { bodyA: "jupiter", bodyB: "saturn", type: "square", orb: 0.5 },
        { bodyA: "sun" },
      ],
    },
  },
};

function httpError(status: number, code: string): FunctionsHttpError {
  return new FunctionsHttpError(new Response(JSON.stringify({ error: { code } }), { status }));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseMonthlyHoroscope", () => {
  it("garde les sections, trie les événements par date et ignore les entrées invalides", () => {
    const parsed = parseMonthlyHoroscope(PAYLOAD);

    expect(parsed?.sections?.work).toBe("W");
    expect(parsed?.basis.ascendantKnown).toBe(true);
    expect(parsed?.basis.events.map((event) => event.kind)).toEqual(["moonPhase", "eclipse", "ingress"]);
    expect(parsed?.basis.aspects).toEqual([{ bodyA: "jupiter", bodyB: "saturn", type: "square", orb: 0.5 }]);
  });

  it("renvoie des sections nulles pour le repli sans IA", () => {
    const { monthStart, monthEnd, basis } = PAYLOAD.horoscope;

    expect(parseMonthlyHoroscope({ horoscope: { monthStart, monthEnd, sections: null, basis } })?.sections).toBeNull();
  });

  it("refuse une réponse incomplète et tolère un fondement absent", () => {
    expect(parseMonthlyHoroscope(null)).toBeNull();
    expect(parseMonthlyHoroscope({ horoscope: { monthStart: "2026-10-01" } })).toBeNull();
    expect(parseMonthlyHoroscope({ horoscope: { monthStart: "a", monthEnd: "b" } })?.basis).toEqual({
      ascendantKnown: false,
      events: [],
      aspects: [],
    });
  });
});

describe("fetchMonthlyHoroscope", () => {
  it("appelle la fonction mensuelle avec la date", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: PAYLOAD, error: null } as never);

    const result = await fetchMonthlyHoroscope("2026-10-27");

    expect(result.error).toBeNull();
    expect(supabase.functions.invoke).toHaveBeenCalledWith("horoscope-monthly", { body: { date: "2026-10-27" } });
  });

  it("traduit les codes d'erreur du serveur", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: httpError(404, "birth_data_not_found"),
    } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: httpError(429, "rate_limit_exceeded"),
    } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: null, error: new Error("réseau") } as never);
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: {}, error: null } as never);

    expect((await fetchMonthlyHoroscope("2026-10-27")).error).toBe("birth_data_not_found");
    expect((await fetchMonthlyHoroscope("2026-10-27")).error).toBe("rate_limit_exceeded");
    expect((await fetchMonthlyHoroscope("2026-10-27")).error).toBe("network_error");
    expect((await fetchMonthlyHoroscope("2026-10-27")).error).toBe("network_error");
  });
});
