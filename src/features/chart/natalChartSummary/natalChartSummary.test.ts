import { FunctionsHttpError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNatalChartSummary, parseNatalChart } from "./natalChartSummary";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { functions: { invoke: vi.fn() }, from: vi.fn() },
}));

const invoke = vi.mocked(supabase.functions.invoke);
const from = vi.mocked(supabase.from);

const rawChart = {
  confidence: "medium",
  engine: { name: "astronomy-engine", version: "2.1.19" },
  bodies: [
    { body: "sun", sign: "taurus", degreeInSign: 14.6 },
    { body: "moon", sign: "cancer", degreeInSign: 3.2 },
  ],
  angles: { ascendant: { sign: "scorpio", degreeInSign: 22.9 } },
  houses: { system: "porphyry" },
  warnings: ["approximate_time", "inconnu", "polar_fallback"],
  moonSignChange: { from: "gemini", to: "cancer" },
};

function mockTables(profile: unknown, cache: unknown) {
  from.mockImplementation(((table: string) => {
    const result = { data: table === "profiles" ? profile : cache };
    const builder = {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => Promise.resolve(result),
    };
    return builder;
  }) as unknown as typeof supabase.from);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseNatalChart", () => {
  it("extrait Soleil, Lune, Ascendant, maisons, avertissements connus et moteur", () => {
    expect(parseNatalChart(rawChart, "Camille", "2026-10-16T09:30:00Z")).toEqual({
      firstName: "Camille",
      sun: { sign: "taurus", degreeInSign: 14.6 },
      moon: { sign: "cancer", degreeInSign: 3.2 },
      ascendant: { sign: "scorpio", degreeInSign: 22.9 },
      confidence: "medium",
      warnings: ["approximate_time", "polar_fallback"],
      moonSignChange: { from: "gemini", to: "cancer" },
      houseSystem: "porphyry",
      engine: { name: "astronomy-engine", version: "2.1.19" },
      computedAt: "2026-10-16T09:30:00Z",
    });
  });

  it("tolère l'absence d'angles, de maisons et de changement de signe", () => {
    const summary = parseNatalChart(
      { confidence: "low", bodies: rawChart.bodies, angles: null, houses: null, moonSignChange: null },
      null,
      null,
    );

    expect(summary).toMatchObject({ ascendant: null, houseSystem: null, moonSignChange: null, warnings: [] });
    expect(summary?.engine).toEqual({ name: "", version: "" });
  });

  it("refuse un thème sans confiance valide", () => {
    expect(parseNatalChart({ confidence: "?" }, null, null)).toBeNull();
    expect(parseNatalChart(undefined, null, null)).toBeNull();
  });
});

describe("fetchNatalChartSummary", () => {
  it("assemble le thème, le prénom et la date de calcul", async () => {
    invoke.mockResolvedValue({ data: { chart: rawChart }, error: null });
    mockTables({ display_name: "Camille" }, { computed_at: "2026-10-16T09:30:00Z" });

    const result = await fetchNatalChartSummary();

    expect(invoke).toHaveBeenCalledWith("natal-chart", { method: "GET" });
    expect(result.error).toBeNull();
    expect(result.summary).toMatchObject({ firstName: "Camille", computedAt: "2026-10-16T09:30:00Z" });
  });

  it("laisse prénom et date à null s'ils sont absents", async () => {
    invoke.mockResolvedValue({ data: { chart: rawChart }, error: null });
    mockTables({ display_name: "  " }, null);

    const result = await fetchNatalChartSummary();

    expect(result.summary).toMatchObject({ firstName: null, computedAt: null });
  });

  it("renvoie le code d'erreur de la fonction", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(
        new Response(JSON.stringify({ error: { code: "birth_data_not_found" } }), { status: 404 }),
      ),
    });

    await expect(fetchNatalChartSummary()).resolves.toEqual({ summary: null, error: "birth_data_not_found" });
  });

  it("renvoie internal_error quand le thème est illisible", async () => {
    invoke.mockResolvedValue({ data: { chart: { confidence: "x" } }, error: null });
    mockTables(null, null);

    await expect(fetchNatalChartSummary()).resolves.toEqual({ summary: null, error: "internal_error" });
  });
});
