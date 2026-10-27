import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

export const WEEKLY_SECTIONS = ["general", "relations", "work", "energy"] as const;

export type WeeklySection = (typeof WEEKLY_SECTIONS)[number];

export const WEEKLY_ERROR_CODES = [
  "birth_data_not_found",
  "unauthenticated",
  "rate_limit_exceeded",
  "network_error",
] as const;

export type WeeklyErrorCode = (typeof WEEKLY_ERROR_CODES)[number];

export interface WeeklyEvent {
  kind: "ingress" | "station" | "moonPhase" | "eclipse";
  body: string;
  detail: string;
  at: string;
}

export interface WeeklyAspect {
  bodyA: string;
  bodyB: string;
  type: string;
  orb: number;
}

export interface WeeklyBasis {
  ascendantKnown: boolean;
  events: WeeklyEvent[];
  aspects: WeeklyAspect[];
}

export interface WeeklyHoroscope {
  weekStart: string;
  weekEnd: string;
  sections: Record<WeeklySection, string> | null;
  basis: WeeklyBasis;
}

export interface WeeklyHoroscopeResult {
  data: WeeklyHoroscope | null;
  error: WeeklyErrorCode | null;
}

const WEEKLY_FUNCTION = "horoscope-weekly";

const SERVER_CODES: Partial<Record<string, WeeklyErrorCode>> = {
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

function parseEvents(raw: unknown): WeeklyEvent[] {
  const source = isRecord(raw) ? raw : {};
  const events: WeeklyEvent[] = [];
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

function parseAspects(raw: unknown): WeeklyAspect[] {
  const aspects: WeeklyAspect[] = [];
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

function parseSections(raw: unknown): Record<WeeklySection, string> | null {
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

export function parseWeeklyHoroscope(raw: unknown): WeeklyHoroscope | null {
  const horoscope = isRecord(raw) ? raw.horoscope : undefined;
  if (!isRecord(horoscope)) return null;
  const weekStart = text(horoscope.weekStart);
  const weekEnd = text(horoscope.weekEnd);
  if (weekStart === null || weekEnd === null) return null;
  const basis = isRecord(horoscope.basis) ? horoscope.basis : {};
  return {
    weekStart,
    weekEnd,
    sections: parseSections(horoscope.sections),
    basis: {
      ascendantKnown: basis.ascendantKnown === true,
      events: parseEvents(basis.events),
      aspects: parseAspects(basis.aspects),
    },
  };
}

async function toErrorCode(error: unknown): Promise<WeeklyErrorCode> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const body: unknown = await error.context.json().catch(() => null);
    const detail = isRecord(body) && isRecord(body.error) ? body.error.code : undefined;
    if (typeof detail === "string") return SERVER_CODES[detail] ?? "network_error";
  }
  return "network_error";
}

export async function fetchWeeklyHoroscope(date: string): Promise<WeeklyHoroscopeResult> {
  const { data, error } = await supabase.functions.invoke<unknown>(WEEKLY_FUNCTION, {
    body: { date },
  });
  if (error) return { data: null, error: await toErrorCode(error) };
  const horoscope = parseWeeklyHoroscope(data);
  return horoscope ? { data: horoscope, error: null } : { data: null, error: "network_error" };
}
