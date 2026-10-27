export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(
  error: unknown,
  headers?: HeadersInit,
  correlationId: string = crypto.randomUUID(),
): Response {
  if (error instanceof HttpError) {
    if (error.status >= 500) console.error("http_error", error.code, correlationId);
    return json(
      { error: { code: error.code, message: error.message, correlationId } },
      { status: error.status, headers },
    );
  }

  console.error(
    "unexpected_error",
    error instanceof Error ? error.name : typeof error,
    correlationId,
  );
  return json(
    {
      error: {
        code: "internal_error",
        message: "Une erreur inattendue est survenue.",
        correlationId,
      },
    },
    { status: 500, headers },
  );
}
