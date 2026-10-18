import type { Json } from "../../../shared/database.types.ts";

export function toJson(value: unknown): Json {
  if (
    value === null || typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toJson);
  }
  if (typeof value === "object") {
    const result: { [key: string]: Json } = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) result[key] = toJson(entry);
    }
    return result;
  }
  throw new Error("value_not_serializable");
}
