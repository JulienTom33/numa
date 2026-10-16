import { FunctionsHttpError } from "@supabase/supabase-js";
import type { ComputedAscendant } from "./ascendant";
import { supabase } from "./supabaseClient";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

export type NatalChartErrorCode =
  | "unauthenticated"
  | "birth_data_not_found"
  | "invalid_birth_data"
  | "network_error"
  | "internal_error";

export type NatalChartConfidence = "high" | "medium" | "low";

export interface ComputedAscendantResult {
  ascendant: ComputedAscendant | null;
  confidence: NatalChartConfidence | null;
  error: NatalChartErrorCode | null;
}

interface RawAscendant {
  sign?: unknown;
  degreeInSign?: unknown;
}

interface RawChart {
  chart?: {
    confidence?: unknown;
    angles?: { ascendant?: RawAscendant } | null;
  };
}

const KNOWN_ERRORS: readonly NatalChartErrorCode[] = [
  "unauthenticated",
  "birth_data_not_found",
  "invalid_birth_data",
  "internal_error",
];

export function toKnownErrorCode(code: unknown): NatalChartErrorCode {
  return KNOWN_ERRORS.find((known) => known === code) ?? "internal_error";
}

function isSign(value: unknown): value is ZodiacSign {
  return ZODIAC_SIGNS.some((sign) => sign === value);
}

function isConfidence(value: unknown): value is NatalChartConfidence {
  return value === "high" || value === "medium" || value === "low";
}

export async function toErrorCode(error: unknown): Promise<NatalChartErrorCode> {
  if (!(error instanceof FunctionsHttpError)) {
    return "network_error";
  }
  try {
    const body = (await error.context.json()) as { error?: { code?: unknown } };
    return toKnownErrorCode(body.error?.code);
  } catch {
    return "internal_error";
  }
}

function toAscendant(raw: RawAscendant | undefined): ComputedAscendant | null {
  if (!raw || !isSign(raw.sign) || typeof raw.degreeInSign !== "number") {
    return null;
  }
  return { sign: raw.sign, degreeInSign: raw.degreeInSign };
}

export async function fetchComputedAscendant(): Promise<ComputedAscendantResult> {
  const { data, error } = await supabase.functions.invoke<RawChart>("natal-chart", { method: "GET" });

  if (error) {
    return { ascendant: null, confidence: null, error: await toErrorCode(error) };
  }

  const chart = data?.chart;
  if (!chart) {
    return { ascendant: null, confidence: null, error: "internal_error" };
  }
  return {
    ascendant: toAscendant(chart.angles?.ascendant),
    confidence: isConfidence(chart.confidence) ? chart.confidence : null,
    error: null,
  };
}
