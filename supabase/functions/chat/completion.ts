import type { ProviderSettings } from "./config.ts";
import { type ChatMessage, MAX_OUTPUT_TOKENS } from "./prompt.ts";

export type FailureKind = "timeout" | "rate_limited" | "http_error" | "invalid_response";

export class ProviderFailure extends Error {
  constructor(readonly kind: FailureKind, readonly retryAfterMs: number | null = null) {
    super(kind);
    this.name = "ProviderFailure";
  }
}

export interface Completion {
  text: string;
  truncated: boolean;
}

function parseRetryAfter(header: string | null): number | null {
  if (header === null) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

function readCompletion(body: unknown): Completion {
  const choices = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).choices
    : undefined;
  const first: unknown = Array.isArray(choices) ? choices[0] : undefined;
  if (typeof first !== "object" || first === null) throw new ProviderFailure("invalid_response");
  const { message, finish_reason: finishReason } = first as Record<string, unknown>;
  const content = typeof message === "object" && message !== null
    ? (message as Record<string, unknown>).content
    : undefined;
  if (typeof content !== "string") throw new ProviderFailure("invalid_response");
  return { text: content, truncated: finishReason === "length" };
}

export async function requestCompletion(
  fetchFn: typeof fetch,
  settings: ProviderSettings,
  apiKey: string,
  messages: ChatMessage[],
): Promise<Completion> {
  let response: Response;
  try {
    response = await fetchFn(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings.extraBody,
        model: settings.model,
        messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(settings.timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ProviderFailure("timeout");
    }
    throw new ProviderFailure("http_error");
  }

  if (response.status === 429) {
    await response.body?.cancel();
    throw new ProviderFailure("rate_limited", parseRetryAfter(response.headers.get("retry-after")));
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new ProviderFailure("http_error");
  }
  try {
    return readCompletion(await response.json());
  } catch (error) {
    if (error instanceof ProviderFailure) throw error;
    throw new ProviderFailure("invalid_response");
  }
}
