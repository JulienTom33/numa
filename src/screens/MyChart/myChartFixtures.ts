import type { CurrentSky, MyChartData, NatalSky, SkyBodyPosition } from "../../lib/skyChart";
import { SKY_BODIES } from "../../lib/skyChart";
import { ZODIAC_SIGNS } from "../../lib/zodiac";
import {
  approximateTimeSummary,
  completeSummary,
  unknownTimeSummary,
} from "../ChartSummary/chartSummaryFixtures";

const NATAL_LONGITUDES = [44.6, 93.2, 70.1, 28.4, 212.9, 301.7, 168.3, 45.8, 276.2, 214.5];

function toBodies(longitudes: number[], withHouses: boolean): SkyBodyPosition[] {
  return SKY_BODIES.map((body, index) => {
    const longitude = longitudes[index];
    const signIndex = Math.floor(longitude / 30);
    return {
      body,
      longitude,
      sign: ZODIAC_SIGNS[signIndex],
      degreeInSign: longitude - signIndex * 30,
      retrograde: index === 5,
      house: withHouses ? Math.floor(((longitude - 232.9 + 360) % 360) / 30) + 1 : null,
    };
  });
}

const CUSPS = Array.from({ length: 12 }, (_, index) => (232.9 + index * 30) % 360);

export const completeNatal: NatalSky = {
  bodies: toBodies(NATAL_LONGITUDES, true),
  ascendantLongitude: 232.9,
  cusps: CUSPS,
};

export const unknownTimeNatal: NatalSky = {
  bodies: toBodies(NATAL_LONGITUDES, false),
  ascendantLongitude: null,
  cusps: null,
};

export const currentSky: CurrentSky = {
  generatedAt: "2026-10-16T12:00:00Z",
  bodies: toBodies([202.1, 330.5, 215.4, 241.8, 233.3, 78.9, 4.6, 61.2, 1.9, 305.7], false),
  aspects: [
    { transitBody: "mars", natalPoint: "ascendant", type: "conjunction", orb: 0.4 },
    { transitBody: "venus", natalPoint: "moon", type: "square", orb: 1.2 },
    { transitBody: "saturn", natalPoint: "sun", type: "trine", orb: 2.6 },
  ],
};

export const completeChart: MyChartData = {
  summary: completeSummary,
  natal: completeNatal,
  transits: currentSky,
};

export const unknownTimeChart: MyChartData = {
  summary: unknownTimeSummary,
  natal: unknownTimeNatal,
  transits: { ...currentSky, aspects: currentSky.aspects.filter((aspect) => aspect.natalPoint === "sun") },
};

export const approximateTimeChart: MyChartData = {
  summary: approximateTimeSummary,
  natal: completeNatal,
  transits: null,
};
