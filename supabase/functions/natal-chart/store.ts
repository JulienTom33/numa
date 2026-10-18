import { createClient } from "jsr:@supabase/supabase-js@2";
import type { Database } from "../../../shared/database.types.ts";
import type { BirthInput } from "./types.ts";

export interface BirthDataStore {
  findLatest(accessToken: string, userId: string): Promise<BirthRecord | null>;
}

export interface BirthRecord {
  id: string;
  birth: BirthInput;
}

export interface BirthDataRow {
  id: string;
  birth_date: string;
  birth_time: string | null;
  time_precision: BirthInput["timePrecision"];
  time_margin: BirthInput["timeMargin"];
  timezone: string;
  latitude: number | string;
  longitude: number | string;
}

export function toBirthInput(row: BirthDataRow): BirthInput {
  return {
    birthDate: row.birth_date,
    birthTime: row.birth_time,
    timePrecision: row.time_precision,
    timeMargin: row.time_margin,
    timezone: row.timezone,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing_env:${name}`);
  return value;
}

function publishableKey(): string {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    const keys = JSON.parse(raw) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  return requireEnv("SUPABASE_ANON_KEY");
}

export function createSupabaseBirthDataStore(): BirthDataStore {
  return {
    async findLatest(accessToken, userId) {
      const client = createClient<Database>(requireEnv("SUPABASE_URL"), publishableKey(), {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      const { data, error } = await client
        .from("birth_data")
        .select(
          "id, birth_date, birth_time, time_precision, time_margin, timezone, latitude, longitude",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<BirthDataRow>();
      if (error) throw new Error("birth_data_read_failed");
      return data ? { id: data.id, birth: toBirthInput(data) } : null;
    },
  };
}
