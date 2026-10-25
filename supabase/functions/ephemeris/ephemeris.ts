import type { HandlerContext } from "../_shared/handler.ts";
import { json } from "../_shared/http.ts";
import { computeEphemeris } from "./compute.ts";
import { parseRange } from "./range.ts";

export const EPHEMERIS_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";

export function handleEphemeris({ req }: HandlerContext): Response {
  const range = parseRange(new URL(req.url).searchParams);
  return json(computeEphemeris(range), { headers: { "Cache-Control": EPHEMERIS_CACHE_CONTROL } });
}
