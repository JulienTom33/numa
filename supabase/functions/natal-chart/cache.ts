import { createAdminClient } from "../_shared/supabase.ts";
import { toJson } from "./toJson.ts";
import type { NatalChart } from "./types.ts";

export interface ChartCache {
  find(birthDataId: string, key: string): Promise<NatalChart | null>;
  save(userId: string, birthDataId: string, key: string, chart: NatalChart): Promise<void>;
}

interface CachedRow {
  chart_data: NatalChart;
}

export function createSupabaseChartCache(): ChartCache {
  return {
    async find(birthDataId, key) {
      const { data, error } = await createAdminClient()
        .from("natal_charts")
        .select("chart_data")
        .eq("birth_data_id", birthDataId)
        .eq("cache_key", key)
        .maybeSingle<CachedRow>();
      if (error) throw new Error("chart_cache_read_failed");
      return data ? data.chart_data : null;
    },
    async save(userId, birthDataId, key, chart) {
      const client = createAdminClient();
      const { error } = await client.from("natal_charts").upsert(
        {
          user_id: userId,
          birth_data_id: birthDataId,
          cache_key: key,
          chart_data: toJson(chart),
        },
        { onConflict: "birth_data_id,cache_key", ignoreDuplicates: true },
      );
      if (error) throw new Error("chart_cache_write_failed");
      const purge = await client
        .from("natal_charts")
        .delete()
        .eq("birth_data_id", birthDataId)
        .neq("cache_key", key);
      if (purge.error) throw new Error("chart_cache_purge_failed");
    },
  };
}
