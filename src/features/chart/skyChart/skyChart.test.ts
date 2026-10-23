import { FunctionsHttpError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMyChart, parseBodies, parseCurrentSky, parseCusps, parseNatalSky } from "./skyChart";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() }, from: vi.fn() },
}));

const invoke = vi.mocked(supabase.functions.invoke);
const from = vi.mocked(supabase.from);

const body = (name: string, longitude: number, sign: string) => ({
  body: name,
  longitude,
  sign,
  degreeInSign: longitude % 30,
  retrograde: false,
  house: 3,
});

const rawChart = {
  confidence: "high",
  engine: { name: "astronomy-engine", version: "2.1.19" },
  bodies: [body("sun", 44.6, "taurus"), body("moon", 93.2, "cancer"), { body: "inconnu" }],
  angles: { ascendant: { sign: "scorpio", degreeInSign: 22.9, longitude: 232.9 } },
  houses: {
    system: "placidus",
    cusps: Array.from({ length: 12 }, (_, index) => ({ longitude: index * 30 })),
  },
  warnings: [],
};

const rawSky = {
  generatedAt: "2026-10-16T12:00:00Z",
  bodies: [body("sun", 202.1, "libra")],
  aspects: [
    { transitBody: "mars", natalPoint: "sun", type: "trine", orb: 1.5 },
    { transitBody: "mars", natalPoint: "venus", type: "trine", orb: 1.5 },
  ],
};

function mockTables() {
  from.mockImplementation((() => {
    const builder = {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => Promise.resolve({ data: { computed_at: "2026-10-16T09:30:00Z" } }),
    };
    return builder;
  }) as unknown as typeof supabase.from);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTables();
});

describe("parsers", () => {
  it("ne garde que les corps valides", () => {
    expect(parseBodies(rawChart.bodies)).toHaveLength(2);
    expect(parseBodies(null)).toEqual([]);
  });

  it("exige 12 cuspides numériques", () => {
    expect(parseCusps(rawChart.houses.cusps)).toHaveLength(12);
    expect(parseCusps([{ longitude: 1 }])).toBeNull();
    expect(parseCusps(Array.from({ length: 12 }, () => ({})))).toBeNull();
    expect(parseCusps(undefined)).toBeNull();
  });

  it("extrait l'Ascendant et les cuspides, ou null si l'heure est inconnue", () => {
    expect(parseNatalSky(rawChart).ascendantLongitude).toBe(232.9);
    const unknown = parseNatalSky({ ...rawChart, angles: null, houses: null });
    expect(unknown.ascendantLongitude).toBeNull();
    expect(unknown.cusps).toBeNull();
  });

  it("ignore les aspects à un point inconnu et refuse un ciel vide", () => {
    expect(parseCurrentSky(rawSky)?.aspects).toHaveLength(1);
    expect(parseCurrentSky({ generatedAt: "x", bodies: [] })).toBeNull();
    expect(parseCurrentSky(null)).toBeNull();
    expect(parseCurrentSky({ bodies: rawSky.bodies })).toBeNull();
  });
});

describe("fetchMyChart", () => {
  it("combine thème natal et ciel actuel", async () => {
    invoke.mockImplementation(((name: string) =>
      Promise.resolve({ data: name === "natal-chart" ? { chart: rawChart } : rawSky, error: null })) as typeof invoke);

    const result = await fetchMyChart();

    expect(result.error).toBeNull();
    expect(result.data?.summary.houseSystem).toBe("placidus");
    expect(result.data?.summary.computedAt).toBe("2026-10-16T09:30:00Z");
    expect(result.data?.natal.cusps).toHaveLength(12);
    expect(result.data?.transits?.aspects).toHaveLength(1);
  });

  it("garde le thème si le ciel actuel échoue", async () => {
    invoke.mockImplementation(((name: string) =>
      name === "natal-chart"
        ? Promise.resolve({ data: { chart: rawChart }, error: null })
        : Promise.resolve({ data: null, error: new Error("boom") })) as typeof invoke);

    const result = await fetchMyChart();

    expect(result.data?.transits).toBeNull();
    expect(result.error).toBeNull();
  });

  it("garde le thème si l'appel current-sky lève une exception", async () => {
    invoke.mockImplementation(((name: string) =>
      name === "natal-chart"
        ? Promise.resolve({ data: { chart: rawChart }, error: null })
        : Promise.reject(new Error("réseau"))) as typeof invoke);

    expect((await fetchMyChart()).data?.transits).toBeNull();
  });

  it("traduit l'erreur du thème en code", async () => {
    const error = new FunctionsHttpError(
      new Response(JSON.stringify({ error: { code: "birth_data_not_found" } }), { status: 404 }),
    );
    invoke.mockImplementation(((name: string) =>
      Promise.resolve(name === "natal-chart" ? { data: null, error } : { data: rawSky, error: null })) as typeof invoke);

    expect(await fetchMyChart()).toEqual({ data: null, error: "birth_data_not_found" });
  });

  it("signale une réponse de thème inexploitable", async () => {
    invoke.mockResolvedValue({ data: {}, error: null } as never);

    expect(await fetchMyChart()).toEqual({ data: null, error: "internal_error" });
  });
});
