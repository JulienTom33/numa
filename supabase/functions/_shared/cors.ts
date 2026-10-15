const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";

export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function corsHeaders(req: Request, allowedOrigins: string[], methods: string[]): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": [...methods, "OPTIONS"].join(", "),
    Vary: "Origin",
  });

  // Seules les origines listées reçoivent l'en-tête : le navigateur bloque les autres.
  const origin = req.headers.get("Origin");
  if (origin && allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}
