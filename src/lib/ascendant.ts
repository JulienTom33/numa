import type { ZodiacSign } from "./zodiac";

export type AscendantSource = "computed" | "declared";

export interface AscendantChoice {
  source: AscendantSource | null;
  declaredSign: ZodiacSign | null;
}

export interface ComputedAscendant {
  sign: ZodiacSign;
  degreeInSign: number;
}

export const EMPTY_ASCENDANT_CHOICE: AscendantChoice = { source: null, declaredSign: null };

export function ascendantsDiffer(computed: ComputedAscendant | null, declaredSign: ZodiacSign | null): boolean {
  return computed !== null && declaredSign !== null && computed.sign !== declaredSign;
}
