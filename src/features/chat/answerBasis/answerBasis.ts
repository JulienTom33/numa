import type {
  AspectType,
  BodyId,
  ChartWarning,
  Confidence,
} from "../../../../shared/contracts/natalChart/natalChart";
import type { ZodiacSign } from "../../../../shared/zodiac/zodiac";

export interface BasisBody {
  body: BodyId;
  sign: ZodiacSign;
  degreeInSign: number;
  retrograde: boolean;
  house: number | null;
}

export interface BasisPoint {
  sign: ZodiacSign;
  degreeInSign: number;
}

export interface BasisAspect {
  bodyA: BodyId;
  bodyB: BodyId;
  type: AspectType;
  orb: number;
}

export interface AnswerBasis {
  confidence: Confidence;
  houseSystem: string | null;
  bodies: BasisBody[];
  ascendant: BasisPoint | null;
  midheaven: BasisPoint | null;
  aspects: BasisAspect[];
  warnings: ChartWarning[];
}
