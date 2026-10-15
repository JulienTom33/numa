import { HttpError } from "./http.ts";

export interface Caller {
  userId: string;
  isAnonymous: boolean;
}

export type JwtClaims = Record<string, unknown>;

export type TokenVerifier = (token: string) => Promise<JwtClaims | null>;

const BEARER_PREFIX = "Bearer ";

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith(BEARER_PREFIX)) return null;

  const token = header.slice(BEARER_PREFIX.length).trim();
  return token || null;
}

export async function authenticate(req: Request, verifyToken: TokenVerifier): Promise<Caller> {
  const token = extractBearerToken(req);
  if (!token) {
    throw new HttpError(401, "unauthenticated", "Authentification requise.");
  }

  const claims = (await verifyToken(token)) ?? {};
  const userId = claims.sub;
  if (typeof userId !== "string" || userId === "") {
    throw new HttpError(401, "invalid_token", "Session invalide ou expirée.");
  }

  return { userId, isAnonymous: claims.is_anonymous === true };
}
