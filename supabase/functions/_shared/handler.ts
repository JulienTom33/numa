import { authenticate, type Caller, type TokenVerifier } from "./auth.ts";
import { corsHeaders } from "./cors.ts";
import { errorResponse, HttpError } from "./http.ts";
import { logEvent } from "./logger.ts";

export interface HandlerContext {
  req: Request;
  caller: Caller;
}

interface Options {
  functionName?: string;
  methods: string[];
  allowedOrigins: string[];
  verifyToken: TokenVerifier;
  handle: (context: HandlerContext) => Response | Promise<Response>;
}

const QUOTA_CODES = new Set(["rate_limit_exceeded", "ai_daily_limit_exceeded", "quota_exceeded"]);

function logOutcome(
  functionName: string,
  req: Request,
  requestId: string,
  startedAt: number,
  status: number,
  code: string | null,
): void {
  const base = {
    function: functionName,
    method: req.method,
    request_id: requestId,
    status,
    code,
    latency_ms: Date.now() - startedAt,
  };
  if (status === 401) logEvent("warn", "auth_failure", base);
  else if (code !== null && QUOTA_CODES.has(code)) logEvent("warn", "quota_rejected", base);
  logEvent(status >= 500 ? "error" : "info", "request_completed", base);
}

export function createHandler(
  { functionName = "unknown", methods, allowedOrigins, verifyToken, handle }: Options,
): (req: Request) => Promise<Response> {
  return async (req) => {
    const cors = corsHeaders(req, allowedOrigins, methods);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const requestId = crypto.randomUUID();
    const startedAt = Date.now();

    try {
      if (!methods.includes(req.method)) {
        throw new HttpError(405, "method_not_allowed", "Méthode non autorisée.");
      }

      const caller = await authenticate(req, verifyToken);
      const response = await handle({ req, caller });
      cors.forEach((value, key) => response.headers.set(key, value));
      logOutcome(functionName, req, requestId, startedAt, response.status, null);
      return response;
    } catch (error) {
      const response = errorResponse(error, cors, requestId);
      const code = error instanceof HttpError ? error.code : "internal_error";
      logOutcome(functionName, req, requestId, startedAt, response.status, code);
      return response;
    }
  };
}
