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

export function errorResponse(error: unknown, headers?: HeadersInit): Response {
  if (error instanceof HttpError) {
    return json(
      { error: { code: error.code, message: error.message } },
      { status: error.status, headers },
    );
  }

  console.error("unexpected_error", error instanceof Error ? error.name : typeof error);
  return json(
    { error: { code: "internal_error", message: "Une erreur inattendue est survenue." } },
    { status: 500, headers },
  );
}
