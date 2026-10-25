import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  EPHEMERIS_ERROR_CODES,
  EPHEMERIS_MAX_DAYS,
  EPHEMERIS_SCHEMA_VERSION,
  type Ephemeris,
  type EphemerisErrorCode,
} from "../../../../shared/contracts/ephemeris/ephemeris.ts";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

export type { Ephemeris, EphemerisErrorCode };

export { EPHEMERIS_MAX_DAYS };

export interface EphemerisRequest {
  from: string;
  to?: string;
}

export interface EphemerisResult {
  data: Ephemeris | null;
  error: EphemerisErrorCode | null;
}

export function toEphemerisErrorCode(code: unknown): EphemerisErrorCode {
  return (
    EPHEMERIS_ERROR_CODES.find((known) => known === code) ?? "internal_error"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readErrorCode(error: unknown): Promise<EphemerisErrorCode> {
  if (!(error instanceof FunctionsHttpError)) return "network_error";
  try {
    const body: unknown = await error.context.json();
    const detail = isRecord(body) ? body.error : undefined;
    return toEphemerisErrorCode(isRecord(detail) ? detail.code : undefined);
  } catch {
    return "internal_error";
  }
}

function isEphemeris(value: unknown): value is Ephemeris {
  return (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    value.schemaVersion === EPHEMERIS_SCHEMA_VERSION &&
    "days" in value &&
    Array.isArray(value.days) &&
    "events" in value
  );
}

export function buildEphemerisPath({ from, to }: EphemerisRequest): string {
  const params = new URLSearchParams(
    to === undefined || to === from ? { date: from } : { from, to },
  );
  return `ephemeris?${params.toString()}`;
}

export async function fetchEphemeris(
  request: EphemerisRequest,
): Promise<EphemerisResult> {
  const { data, error } = await supabase.functions.invoke<unknown>(
    buildEphemerisPath(request),
    {
      method: "GET",
    },
  );
  if (error) return { data: null, error: await readErrorCode(error) };
  return isEphemeris(data)
    ? { data, error: null }
    : { data: null, error: "internal_error" };
}
