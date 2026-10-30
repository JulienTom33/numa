import { isRecord } from "./guards.ts";

export interface ProviderSettings {
  id: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  enabled: boolean;
  apiKeyEnv: string;
  extraBody?: Record<string, unknown>;
}

export const DEFAULT_PROVIDERS: ProviderSettings[] = [
  {
    id: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.1-flash-lite",
    timeoutMs: 20_000,
    enabled: true,
    apiKeyEnv: "GEMINI_API_KEY",
  },
  {
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
    timeoutMs: 10_000,
    enabled: true,
    apiKeyEnv: "GROQ_API_KEY",
    extraBody: { reasoning_effort: "low" },
  },
];

function parseEntry(entry: unknown): ProviderSettings {
  if (!isRecord(entry)) throw new Error("ai_providers_invalid");
  const { id, baseUrl, model, timeoutMs, enabled, apiKeyEnv, extraBody } = entry;
  if (
    typeof id !== "string" || typeof baseUrl !== "string" || typeof model !== "string" ||
    typeof apiKeyEnv !== "string" || typeof timeoutMs !== "number" || timeoutMs <= 0 ||
    typeof enabled !== "boolean" || !baseUrl.startsWith("https://") ||
    (extraBody !== undefined && !isRecord(extraBody))
  ) {
    throw new Error("ai_providers_invalid");
  }
  return { id, baseUrl, model, timeoutMs, enabled, apiKeyEnv, extraBody };
}

export function parseProviders(raw: string | undefined): ProviderSettings[] {
  if (!raw) return DEFAULT_PROVIDERS;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("ai_providers_invalid");
  return parsed.map(parseEntry);
}
