import { describe, expect, it, vi } from "vitest";
import { currentSky } from "../../chart/MyChart/myChartFixtures";
import { aspectStrength, readEnergy } from "./todayEnergy";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

describe("readEnergy", () => {
  it("retient l'aspect le plus serré comme repère principal", () => {
    expect(readEnergy(currentSky).headline).toEqual(currentSky.aspects[0]);
  });

  it("répartit l'intensité par influence selon les planètes en transit", () => {
    const { influences } = readEnergy(currentSky);

    expect(influences).toEqual([
      { influence: "relations", level: "calm" },
      { influence: "love", level: "strong" },
      { influence: "work", level: "moderate" },
      { influence: "energy", level: "strong" },
    ]);
  });

  it("reste calme sans aucun aspect", () => {
    const reading = readEnergy({ ...currentSky, aspects: [] });

    expect(reading.headline).toBeNull();
    expect(reading.influences.every(({ level }) => level === "calm")).toBe(true);
  });

  it("décroit avec l'écart et s'annule au-delà de l'orbe maximal", () => {
    const base = { transitBody: "mars", natalPoint: "sun", type: "conjunction" } as const;

    expect(aspectStrength({ ...base, orb: 0 })).toBeGreaterThan(aspectStrength({ ...base, orb: 4 }));
    expect(aspectStrength({ ...base, orb: 12 })).toBe(0);
  });
});
