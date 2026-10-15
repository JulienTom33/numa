import { authenticate, type Caller, type TokenVerifier } from "./auth.ts";
import { corsHeaders } from "./cors.ts";
import { errorResponse, HttpError } from "./http.ts";

export interface HandlerContext {
  req: Request;
  caller: Caller;
}

interface Options {
  methods: string[];
  allowedOrigins: string[];
  verifyToken: TokenVerifier;
  handle: (context: HandlerContext) => Response | Promise<Response>;
}

export function createHandler(
  { methods, allowedOrigins, verifyToken, handle }: Options,
): (req: Request) => Promise<Response> {
  return async (req) => {
    const cors = corsHeaders(req, allowedOrigins, methods);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (!methods.includes(req.method)) {
        throw new HttpError(405, "method_not_allowed", "Méthode non autorisée.");
      }

      const caller = await authenticate(req, verifyToken);
      const response = await handle({ req, caller });
      cors.forEach((value, key) => response.headers.set(key, value));
      return response;
    } catch (error) {
      return errorResponse(error, cors);
    }
  };
}
