import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  ASPECT_TYPES,
  CHART_WARNINGS,
  type ChartWarning,
} from "../../../../shared/contracts/natalChart/natalChart.ts";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { NATAL_POINTS, SKY_BODIES, type TransitAspect } from "../../chart/skyChart/skyChart";

export const HOROSCOPE_SECTIONS = ["general", "relations", "work", "energy"] as const;

export type HoroscopeSection = (typeof HOROSCOPE_SECTIONS)[number];

export const HOROSCOPE_ERROR_CODES = [
  "birth_data_not_found",
  "unauthenticated",
  "ai_unavailable",
  "rate_limit_exceeded",
  "ai_daily_limit_exceeded",
  "network_error",
] as const;

export type HoroscopeErrorCode = (typeof HOROSCOPE_ERROR_CODES)[number];

export interface HoroscopeBasis {
  confidence: string | null;
  aspects: TransitAspect[];
  warnings: ChartWarning[];
}

export interface Horoscope {
  date: string;
  sections: Record<HoroscopeSection, string>;
  basis: HoroscopeBasis;
}

export interface HoroscopeResult {
  data: Horoscope | null;
  error: HoroscopeErrorCode | null;
}

const HOROSCOPE_FUNCTION = "horoscope";

const SERVER_CODES: Partial<Record<string, HoroscopeErrorCode>> = {
  birth_data_not_found: "birth_data_not_found",
  unauthenticated: "unauthenticated",
  invalid_token: "unauthenticated",
  ai_unavailable: "ai_unavailable",
  rate_limit_exceeded: "rate_limit_exceeded",
  ai_daily_limit_exceeded: "ai_daily_limit_exceeded",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.some((candidate) => candidate === value);
}

function parseAspects(raw: unknown): TransitAspect[] {
  const aspects: TransitAspect[] = [];
  const items: unknown[] = Array.isArray(raw) ? raw : [];
  for (const item of items) {
    if (
      isRecord(item) &&
      isOneOf(SKY_BODIES, item.transitBody) &&
      isOneOf(NATAL_POINTS, item.natalPoint) &&
      isOneOf(ASPECT_TYPES, item.type) &&
      typeof item.orb === "number"
    ) {
      aspects.push({
        transitBody: item.transitBody,
        natalPoint: item.natalPoint,
        type: item.type,
        orb: item.orb,
      });
    }
  }
  return aspects;
}

function parseBasis(raw: unknown): HoroscopeBasis {
  const basis = isRecord(raw) ? raw : {};
  const warnings: unknown[] = Array.isArray(basis.warnings) ? basis.warnings : [];
  return {
    confidence: typeof basis.confidence === "string" ? basis.confidence : null,
    aspects: parseAspects(basis.aspects),
    warnings: warnings.filter((warning): warning is ChartWarning => isOneOf(CHART_WARNINGS, warning)),
  };
}

export function parseHoroscope(raw: unknown): Horoscope | null {
  const horoscope = isRecord(raw) ? raw.horoscope : undefined;
  if (!isRecord(horoscope) || typeof horoscope.date !== "string" || !isRecord(horoscope.sections)) {
    return null;
  }
  const { general, relations, work, energy } = horoscope.sections;
  if (
    typeof general !== "string" ||
    typeof relations !== "string" ||
    typeof work !== "string" ||
    typeof energy !== "string"
  ) {
    return null;
  }
  return {
    date: horoscope.date,
    sections: { general, relations, work, energy },
    basis: parseBasis(horoscope.basis),
  };
}

export function localIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function toErrorCode(error: unknown): Promise<HoroscopeErrorCode> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const body: unknown = await error.context.json().catch(() => null);
    const detail = isRecord(body) && isRecord(body.error) ? body.error.code : undefined;
    if (typeof detail === "string") return SERVER_CODES[detail] ?? "network_error";
  }
  return "network_error";
}

export async function fetchHoroscope(date: string): Promise<HoroscopeResult> {
  const { data, error } = await supabase.functions.invoke<unknown>(HOROSCOPE_FUNCTION, {
    body: { date },
  });
  if (error) return { data: null, error: await toErrorCode(error) };
  const horoscope = parseHoroscope(data);
  return horoscope ? { data: horoscope, error: null } : { data: null, error: "network_error" };
}
