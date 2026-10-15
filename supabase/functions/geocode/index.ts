// Recherche de lieux de naissance (Open-Meteo Geocoding) : appel tiers gardé côté serveur.
import { parseAllowedOrigins } from "../_shared/cors.ts";
import { verifySupabaseToken } from "../_shared/supabase.ts";
import { createGeocodeHandler } from "./handler.ts";

Deno.serve(
  createGeocodeHandler({
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    fetch: (input, init) => fetch(input, init),
  }),
);
