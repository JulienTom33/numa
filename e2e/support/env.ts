import { execSync } from "node:child_process";

export interface SupabaseLocalEnv {
  apiUrl: string;
  publishableKey: string;
}

function parseEnvOutput(output: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of output.split(/\r?\n/)) {
    const match = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim());
    if (match) values[match[1]] = match[2];
  }
  return values;
}

export function loadSupabaseEnv(): SupabaseLocalEnv {
  const apiUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (apiUrl && publishableKey) return { apiUrl, publishableKey };

  const status = parseEnvOutput(execSync("npx supabase status -o env", { encoding: "utf8" }));
  const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
  if (!status.API_URL || !key) {
    throw new Error("Stack Supabase locale introuvable : lancer `supabase start`.");
  }
  process.env.VITE_SUPABASE_URL = status.API_URL;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = key;
  return { apiUrl: status.API_URL, publishableKey: key };
}
