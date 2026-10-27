import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { NatalChart } from "../../../shared/contracts/natalChart/natalChart.ts";
import { isRecord } from "../chat/guards.ts";
import type { HoroscopeFactors } from "./context.ts";
import type { GeneratedHoroscope } from "./provider.ts";
import { type HoroscopeSections, joinSections, readSections } from "./sections.ts";

export interface StoredChart {
  id: string;
  chart: NatalChart;
}

export interface ChartSource {
  latest(userId: string): Promise<StoredChart | null>;
}

export interface SavedHoroscope {
  date: string;
  sections: HoroscopeSections;
  factors: unknown;
  promptVersion: string;
}

export interface SaveInput {
  userId: string;
  chartId: string;
  date: string;
  factors: HoroscopeFactors;
  generated: GeneratedHoroscope;
}

export interface HoroscopeStore {
  find(userId: string, date: string): Promise<SavedHoroscope | null>;
  save(input: SaveInput): Promise<SavedHoroscope>;
}

interface ChartRow {
  id: string;
  chart_data: NatalChart;
}

function toSaved(row: unknown): SavedHoroscope | null {
  if (!isRecord(row)) return null;
  const sections = readSections(row.sections);
  if (
    sections === null || typeof row.horoscope_date !== "string" ||
    typeof row.prompt_version !== "string"
  ) {
    return null;
  }
  return {
    date: row.horoscope_date,
    sections,
    factors: row.factors,
    promptVersion: row.prompt_version,
  };
}

export function createSupabaseChartSource(client: SupabaseClient): ChartSource {
  return {
    async latest(userId) {
      const { data, error } = await client
        .from("natal_charts")
        .select("id, chart_data")
        .eq("user_id", userId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle<ChartRow>();
      if (error) throw new Error("chart_read_failed");
      return data ? { id: data.id, chart: data.chart_data } : null;
    },
  };
}

export function createSupabaseHoroscopeStore(client: SupabaseClient): HoroscopeStore {
  const find: HoroscopeStore["find"] = async (userId, date) => {
    const { data, error } = await client
      .from("daily_horoscopes")
      .select("horoscope_date, sections, factors, prompt_version")
      .eq("user_id", userId)
      .eq("horoscope_date", date)
      .maybeSingle();
    if (error) throw new Error("horoscope_read_failed");
    return data ? toSaved(data) : null;
  };

  return {
    find,
    async save({ userId, chartId, date, factors, generated }) {
      const { error } = await client.from("daily_horoscopes").upsert({
        user_id: userId,
        natal_chart_id: chartId,
        horoscope_date: date,
        content: joinSections(generated.sections),
        sections: generated.sections,
        factors,
        prompt_version: generated.promptVersion,
        provider: generated.provider,
        model: generated.model,
      }, { onConflict: "user_id,horoscope_date", ignoreDuplicates: true });
      if (error) throw new Error("horoscope_save_failed");
      const saved = await find(userId, date);
      if (saved === null) throw new Error("horoscope_save_failed");
      return saved;
    },
  };
}
