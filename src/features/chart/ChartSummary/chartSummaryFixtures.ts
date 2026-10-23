import type { NatalChartSummary } from "../natalChartSummary/natalChartSummary";

export const completeSummary: NatalChartSummary = {
  firstName: "Camille",
  sun: { sign: "taurus", degreeInSign: 14.6 },
  moon: { sign: "cancer", degreeInSign: 3.2 },
  ascendant: { sign: "scorpio", degreeInSign: 22.9 },
  confidence: "high",
  warnings: [],
  moonSignChange: null,
  houseSystem: "placidus",
  engine: { name: "astronomy-engine", version: "2.1.19" },
  computedAt: "2026-10-16T09:30:00Z",
};

export const unknownTimeSummary: NatalChartSummary = {
  ...completeSummary,
  ascendant: null,
  confidence: "low",
  warnings: ["unknown_time", "moon_sign_uncertain"],
  moonSignChange: { from: "gemini", to: "cancer" },
  houseSystem: null,
};

export const approximateTimeSummary: NatalChartSummary = {
  ...completeSummary,
  confidence: "medium",
  warnings: ["approximate_time", "polar_fallback"],
  houseSystem: "porphyry",
};
