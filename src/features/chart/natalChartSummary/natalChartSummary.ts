import { toErrorCode, type NatalChartConfidence, type NatalChartErrorCode } from "../natalChart/natalChart";
import {
  CHART_WARNINGS,
  CONFIDENCES,
  HOUSE_SYSTEMS,
  type ChartWarning,
  type HouseSystem,
} from "../../../../shared/contracts/natalChart/natalChart.ts";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { ZODIAC_SIGNS, type ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";


export interface SummaryPlacement {
  sign: ZodiacSign;
  degreeInSign: number;
}

export interface NatalChartSummary {
  firstName: string | null;
  sun: SummaryPlacement | null;
  moon: SummaryPlacement | null;
  ascendant: SummaryPlacement | null;
  confidence: NatalChartConfidence;
  warnings: ChartWarning[];
  moonSignChange: { from: ZodiacSign; to: ZodiacSign } | null;
  houseSystem: HouseSystem | null;
  engine: { name: string; version: string };
  computedAt: string | null;
}

export interface NatalChartSummaryResult {
  summary: NatalChartSummary | null;
  error: NatalChartErrorCode | null;
}

interface RawPlacement {
  body?: unknown;
  sign?: unknown;
  degreeInSign?: unknown;
}

interface RawChart {
  confidence?: unknown;
  engine?: { name?: unknown; version?: unknown };
  bodies?: unknown;
  angles?: { ascendant?: RawPlacement } | null;
  houses?: { system?: unknown } | null;
  warnings?: unknown;
  moonSignChange?: { from?: unknown; to?: unknown } | null;
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

function toPlacement(raw: RawPlacement | undefined): SummaryPlacement | null {
  if (!raw || !isOneOf(ZODIAC_SIGNS, raw.sign) || typeof raw.degreeInSign !== "number") return null;
  return { sign: raw.sign, degreeInSign: raw.degreeInSign };
}

function findBody(bodies: unknown, body: string): SummaryPlacement | null {
  if (!Array.isArray(bodies)) return null;
  return toPlacement((bodies as RawPlacement[]).find((candidate) => candidate.body === body));
}

function toMoonSignChange(raw: RawChart["moonSignChange"]): NatalChartSummary["moonSignChange"] {
  if (!raw || !isOneOf(ZODIAC_SIGNS, raw.from) || !isOneOf(ZODIAC_SIGNS, raw.to)) return null;
  return { from: raw.from, to: raw.to };
}

export function parseNatalChart(
  raw: RawChart | undefined,
  firstName: string | null,
  computedAt: string | null,
): NatalChartSummary | null {
  if (!raw || !isOneOf(CONFIDENCES, raw.confidence)) return null;
  const rawWarnings = Array.isArray(raw.warnings) ? (raw.warnings as unknown[]) : [];
  return {
    firstName,
    sun: findBody(raw.bodies, "sun"),
    moon: findBody(raw.bodies, "moon"),
    ascendant: toPlacement(raw.angles?.ascendant),
    confidence: raw.confidence,
    warnings: rawWarnings.filter((warning): warning is ChartWarning => isOneOf(CHART_WARNINGS, warning)),
    moonSignChange: toMoonSignChange(raw.moonSignChange),
    houseSystem: isOneOf(HOUSE_SYSTEMS, raw.houses?.system) ? raw.houses.system : null,
    engine: {
      name: typeof raw.engine?.name === "string" ? raw.engine.name : "",
      version: typeof raw.engine?.version === "string" ? raw.engine.version : "",
    },
    computedAt,
  };
}

export async function readFirstName(): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("display_name").maybeSingle();
  return typeof data?.display_name === "string" && data.display_name.trim() !== "" ? data.display_name : null;
}

export async function readComputedAt(): Promise<string | null> {
  const { data } = await supabase
    .from("natal_charts")
    .select("computed_at")
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return typeof data?.computed_at === "string" ? data.computed_at : null;
}

export async function fetchNatalChartSummary(): Promise<NatalChartSummaryResult> {
  const { data, error } = await supabase.functions.invoke<{ chart?: RawChart }>("natal-chart", { method: "GET" });
  if (error) return { summary: null, error: await toErrorCode(error) };

  const [firstName, computedAt] = await Promise.all([
    readFirstName().catch(() => null),
    readComputedAt().catch(() => null),
  ]);
  const summary = parseNatalChart(data?.chart, firstName, computedAt);
  return summary ? { summary, error: null } : { summary: null, error: "internal_error" };
}
