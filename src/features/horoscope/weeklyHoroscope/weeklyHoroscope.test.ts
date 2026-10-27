import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { fetchWeeklyHoroscope, parseWeeklyHoroscope } from "./weeklyHoroscope";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const PAYLOAD = {
  horoscope: {
    weekStart: "2026-10-26",
    weekEnd: "2026-11-01",
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
        { bodyA: "sun", bodyB: "saturn", type: "square", orb: 0.5 },
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

describe("parseWeeklyHoroscope", () => {
  it("garde les sections, trie les événements par date et ignore les entrées invalides", () => {
    const parsed = parseWeeklyHoroscope(PAYLOAD);

    expect(parsed?.sections?.work).toBe("W");
    expect(parsed?.basis.ascendantKnown).toBe(true);
    expect(parsed?.basis.events.map((event) => event.kind)).toEqual(["moonPhase", "eclipse", "ingress"]);
    expect(parsed?.basis.aspects).toEqual([{ bodyA: "sun", bodyB: "saturn", type: "square", orb: 0.5 }]);
  });

  it("renvoie des sections nulles pour le repli sans IA", () => {
    const { weekStart, weekEnd, basis } = PAYLOAD.horoscope;

    expect(parseWeeklyHoroscope({ horoscope: { weekStart, weekEnd, sections: null, basis } })?.sections).toBeNull();
  });

  it("refuse une réponse incomplète et tolère un fondement absent", () => {
    expect(parseWeeklyHoroscope(null)).toBeNull();
    expect(parseWeeklyHoroscope({ horoscope: { weekStart: "2026-10-26" } })).toBeNull();
    expect(parseWeeklyHoroscope({ horoscope: { weekStart: "a", weekEnd: "b" } })?.basis).toEqual({
      ascendantKnown: false,
      events: [],
      aspects: [],
    });
  });
});

describe("fetchWeeklyHoroscope", () => {
  it("appelle la fonction hebdomadaire avec la date", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: PAYLOAD, error: null } as never);

    const result = await fetchWeeklyHoroscope("2026-10-27");

    expect(result.error).toBeNull();
    expect(supabase.functions.invoke).toHaveBeenCalledWith("horoscope-weekly", { body: { date: "2026-10-27" } });
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

    expect((await fetchWeeklyHoroscope("2026-10-27")).error).toBe("birth_data_not_found");
    expect((await fetchWeeklyHoroscope("2026-10-27")).error).toBe("rate_limit_exceeded");
    expect((await fetchWeeklyHoroscope("2026-10-27")).error).toBe("network_error");
    expect((await fetchWeeklyHoroscope("2026-10-27")).error).toBe("network_error");
  });
});
