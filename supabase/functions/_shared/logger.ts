export type LogLevel = "info" | "warn" | "error";

export type LogValue = string | number | boolean | null;

export type LogFields = Record<string, LogValue>;

export type ProviderKind = "ai" | "astrology" | "geocoding";

const GEOCODING_SERVICES = new Set(["open-meteo"]);
const ASTROLOGY_SERVICES = new Set(["astrology-api"]);

export function providerKind(service: string): ProviderKind {
  if (GEOCODING_SERVICES.has(service)) return "geocoding";
  if (ASTROLOGY_SERVICES.has(service)) return "astrology";
  return "ai";
}

export function logEvent(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ ...fields, level, event, ts: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
