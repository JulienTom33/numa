import type {
  AspectType,
  BodyId,
  ChartWarning,
  Confidence,
  NatalChart,
} from "../../../shared/contracts/natalChart/natalChart.ts";
import type { EclipticPosition, ZodiacSign } from "../../../shared/zodiac/zodiac.ts";

export const MAX_ASPECTS = 12;

export interface BodyFactor {
  body: BodyId;
  sign: ZodiacSign;
  degreeInSign: number;
  retrograde: boolean;
  house: number | null;
}

export interface PointFactor {
  sign: ZodiacSign;
  degreeInSign: number;
}

export interface AspectFactor {
  bodyA: BodyId;
  bodyB: BodyId;
  type: AspectType;
  orb: number;
}

export interface ChatFactors {
  confidence: Confidence;
  houseSystem: string | null;
  bodies: BodyFactor[];
  ascendant: PointFactor | null;
  midheaven: PointFactor | null;
  aspects: AspectFactor[];
  warnings: ChartWarning[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function toPoint(position: EclipticPosition): PointFactor {
  return { sign: position.sign, degreeInSign: round(position.degreeInSign) };
}

export function extractFactors(chart: NatalChart): ChatFactors {
  return {
    confidence: chart.confidence,
    houseSystem: chart.houses?.system ?? null,
    bodies: chart.bodies.map((body) => ({
      body: body.body,
      sign: body.sign,
      degreeInSign: round(body.degreeInSign),
      retrograde: body.retrograde,
      house: body.house,
    })),
    ascendant: chart.angles ? toPoint(chart.angles.ascendant) : null,
    midheaven: chart.angles ? toPoint(chart.angles.midheaven) : null,
    aspects: chart.aspects.slice(0, MAX_ASPECTS).map((aspect) => ({
      bodyA: aspect.bodyA,
      bodyB: aspect.bodyB,
      type: aspect.type,
      orb: round(aspect.orb),
    })),
    warnings: [...chart.warnings],
  };
}
