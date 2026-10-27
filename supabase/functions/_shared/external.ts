export type ExternalFailureKind = "timeout" | "rate_limited" | "http_error" | "network_error";

export class ExternalFailure extends Error {
  constructor(
    readonly kind: ExternalFailureKind,
    readonly status: number | null = null,
    readonly retryAfterMs: number | null = null,
  ) {
    super(kind);
    this.name = "ExternalFailure";
  }
}

export interface ExternalCallOptions {
  fetchFn: (input: string, init?: RequestInit) => Promise<Response>;
  service: string;
  timeoutMs: number;
  retries?: number;
}

function parseRetryAfter(header: string | null): number | null {
  if (header === null) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

function isTransient(failure: ExternalFailure): boolean {
  return failure.kind === "timeout" || failure.kind === "network_error" ||
    (failure.kind === "http_error" && failure.status !== null && failure.status >= 500);
}

async function attempt(
  url: string,
  init: RequestInit,
  { fetchFn, timeoutMs }: ExternalCallOptions,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ExternalFailure("timeout");
    }
    throw new ExternalFailure("network_error");
  }
  if (response.ok) return response;
  await response.body?.cancel();
  if (response.status === 429) {
    throw new ExternalFailure(
      "rate_limited",
      429,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }
  throw new ExternalFailure("http_error", response.status);
}

export async function fetchExternal(
  url: string,
  init: RequestInit,
  options: ExternalCallOptions,
): Promise<Response> {
  const maxAttempts = 1 + (options.retries ?? 0);
  for (let tries = 1;; tries += 1) {
    try {
      return await attempt(url, init, options);
    } catch (error) {
      if (!(error instanceof ExternalFailure)) throw error;
      console.error("external_failure", options.service, error.kind, error.status ?? "-");
      if (tries >= maxAttempts || !isTransient(error)) throw error;
    }
  }
}
