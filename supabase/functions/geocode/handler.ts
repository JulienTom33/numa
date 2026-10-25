import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import { RATE_LIMITS, type RateLimitStore, withRateLimit } from "../_shared/rateLimit.ts";
import { type FetchFn, parseSearchRequest, searchPlaces } from "./places.ts";

interface Options {
  allowedOrigins: string[];
  verifyToken: TokenVerifier;
  fetch: FetchFn;
  rateLimits: RateLimitStore;
  timeoutMs?: number;
}

export function createGeocodeHandler(
  { allowedOrigins, verifyToken, fetch, rateLimits, timeoutMs }: Options,
): (req: Request) => Promise<Response> {
  return createHandler({
    methods: ["POST"],
    allowedOrigins,
    verifyToken,
    handle: withRateLimit(rateLimits, RATE_LIMITS.geocode, async ({ req }) => {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new HttpError(400, "invalid_body", "Corps de requête JSON attendu.");
      }

      const places = await searchPlaces(parseSearchRequest(body), { fetch, timeoutMs });
      return json({ places });
    }),
  });
}
