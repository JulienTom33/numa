import type { Json } from "../../../shared/database.types.ts";

function convert(value: unknown): Json {
  if (
    value === null || typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(convert);
  }
  if (typeof value === "object") {
    const result: { [key: string]: Json } = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) result[key] = convert(entry);
    }
    return result;
  }
  throw new Error("value_not_serializable");
}

export function toJson(value: unknown): NonNullable<Json> {
  const result = convert(value);
  if (result === null) throw new Error("value_not_serializable");
  return result;
}
