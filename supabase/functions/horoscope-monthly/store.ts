import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { ENGINE_VERSION } from "../../../shared/contracts/natalChart/natalChart.ts";
import { isRecord } from "../chat/guards.ts";
import { type HoroscopeSections, readSections } from "../horoscope/sections.ts";
import type { MonthlyFactors } from "./context.ts";
import type { GeneratedMonthly } from "./provider.ts";

export interface SavedMonthly {
  sections: HoroscopeSections;
  factors: unknown;
  promptVersion: string;
}

export interface SaveMonthlyInput {
  cacheKey: string;
  factors: MonthlyFactors;
  generated: GeneratedMonthly;
}

export interface MonthlyStore {
  find(cacheKey: string): Promise<SavedMonthly | null>;
  save(input: SaveMonthlyInput): Promise<SavedMonthly>;
}

function toSaved(row: unknown): SavedMonthly | null {
  if (!isRecord(row)) return null;
  const sections = readSections(row.sections);
  if (sections === null || typeof row.prompt_version !== "string") return null;
  return { sections, factors: row.factors, promptVersion: row.prompt_version };
}

export function createSupabaseMonthlyStore(client: SupabaseClient): MonthlyStore {
  const find: MonthlyStore["find"] = async (cacheKey) => {
    const { data, error } = await client
      .from("monthly_horoscopes")
      .select("sections, factors, prompt_version")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (error) throw new Error("monthly_horoscope_read_failed");
    return data ? toSaved(data) : null;
  };

  return {
    find,
    async save({ cacheKey, factors, generated }) {
      const { error } = await client.from("monthly_horoscopes").upsert({
        cache_key: cacheKey,
        month_start: factors.month.start,
        sun_sign: factors.sunSign,
        ascendant_sign: factors.ascendantSign,
        prompt_version: generated.promptVersion,
        engine_version: ENGINE_VERSION,
        sections: generated.sections,
        factors,
        provider: generated.provider,
        model: generated.model,
      }, { onConflict: "cache_key", ignoreDuplicates: true });
      if (error) throw new Error("monthly_horoscope_save_failed");
      const saved = await find(cacheKey);
      if (saved === null) throw new Error("monthly_horoscope_save_failed");
      return saved;
    },
  };
}
