import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

export const MONTHLY_SECTIONS = ["general", "relations", "work", "energy"] as const;

export type MonthlySection = (typeof MONTHLY_SECTIONS)[number];

export const MONTHLY_ERROR_CODES = [
  "birth_data_not_found",
  "unauthenticated",
  "rate_limit_exceeded",
  "network_error",
] as const;

export type MonthlyErrorCode = (typeof MONTHLY_ERROR_CODES)[number];

export interface MonthlyEvent {
  kind: "ingress" | "station" | "moonPhase" | "eclipse";
  body: string;
  detail: string;
  at: string;
}

export interface MonthlyAspect {
  bodyA: string;
  bodyB: string;
  type: string;
  orb: number;
}

export interface MonthlyBasis {
  ascendantKnown: boolean;
  events: MonthlyEvent[];
  aspects: MonthlyAspect[];
}

export interface MonthlyHoroscope {
  monthStart: string;
  monthEnd: string;
  sections: Record<MonthlySection, string> | null;
  basis: MonthlyBasis;
}

export interface MonthlyHoroscopeResult {
  data: MonthlyHoroscope | null;
  error: MonthlyErrorCode | null;
}

const MONTHLY_FUNCTION = "horoscope-monthly";

const SERVER_CODES: Partial<Record<string, MonthlyErrorCode>> = {
  birth_data_not_found: "birth_data_not_found",
  unauthenticated: "unauthenticated",
  invalid_token: "unauthenticated",
  rate_limit_exceeded: "rate_limit_exceeded",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  const items: unknown[] = Array.isArray(value) ? value : [];
  return items.filter(isRecord);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseEvents(raw: unknown): MonthlyEvent[] {
  const source = isRecord(raw) ? raw : {};
  const events: MonthlyEvent[] = [];
  for (const item of records(source.ingresses)) {
    const body = text(item.body);
    const detail = text(item.to);
    const at = text(item.at);
    if (body && detail && at) events.push({ kind: "ingress", body, detail, at });
  }
  for (const item of records(source.stations)) {
    const body = text(item.body);
    const detail = text(item.type);
    const at = text(item.at);
    if (body && detail && at) events.push({ kind: "station", body, detail, at });
  }
  for (const item of records(source.moonPhases)) {
    const detail = text(item.phase);
    const at = text(item.at);
    if (detail && at) events.push({ kind: "moonPhase", body: "moon", detail, at });
  }
  for (const item of records(source.eclipses)) {
    const body = text(item.body);
    const detail = text(item.kind);
    const at = text(item.at);
    if (body && detail && at) events.push({ kind: "eclipse", body, detail, at });
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

function parseAspects(raw: unknown): MonthlyAspect[] {
  const aspects: MonthlyAspect[] = [];
  for (const item of records(raw)) {
    const bodyA = text(item.bodyA);
    const bodyB = text(item.bodyB);
    const type = text(item.type);
    if (bodyA && bodyB && type && typeof item.orb === "number") {
      aspects.push({ bodyA, bodyB, type, orb: item.orb });
    }
  }
  return aspects;
}

function parseSections(raw: unknown): Record<MonthlySection, string> | null {
  if (!isRecord(raw)) return null;
  const { general, relations, work, energy } = raw;
  if (
    typeof general !== "string" ||
    typeof relations !== "string" ||
    typeof work !== "string" ||
    typeof energy !== "string"
  ) {
    return null;
  }
  return { general, relations, work, energy };
}

export function parseMonthlyHoroscope(raw: unknown): MonthlyHoroscope | null {
  const horoscope = isRecord(raw) ? raw.horoscope : undefined;
  if (!isRecord(horoscope)) return null;
  const monthStart = text(horoscope.monthStart);
  const monthEnd = text(horoscope.monthEnd);
  if (monthStart === null || monthEnd === null) return null;
  const basis = isRecord(horoscope.basis) ? horoscope.basis : {};
  return {
    monthStart,
    monthEnd,
    sections: parseSections(horoscope.sections),
    basis: {
      ascendantKnown: basis.ascendantKnown === true,
      events: parseEvents(basis.events),
      aspects: parseAspects(basis.aspects),
    },
  };
}

async function toErrorCode(error: unknown): Promise<MonthlyErrorCode> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const body: unknown = await error.context.json().catch(() => null);
    const detail = isRecord(body) && isRecord(body.error) ? body.error.code : undefined;
    if (typeof detail === "string") return SERVER_CODES[detail] ?? "network_error";
  }
  return "network_error";
}

export async function fetchMonthlyHoroscope(date: string): Promise<MonthlyHoroscopeResult> {
  const { data, error } = await supabase.functions.invoke<unknown>(MONTHLY_FUNCTION, {
    body: { date },
  });
  if (error) return { data: null, error: await toErrorCode(error) };
  const horoscope = parseMonthlyHoroscope(data);
  return horoscope ? { data: horoscope, error: null } : { data: null, error: "network_error" };
}
