import { ExternalFailure, fetchExternal } from "../_shared/external.ts";
import type { ProviderSettings } from "./config.ts";
import { isRecord } from "./guards.ts";
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

function readCompletion(body: unknown): Completion {
  const choices = isRecord(body) ? body.choices : undefined;
  const first: unknown = Array.isArray(choices) ? choices[0] : undefined;
  if (!isRecord(first)) throw new ProviderFailure("invalid_response");
  const { message, finish_reason: finishReason } = first;
  const content = isRecord(message) ? message.content : undefined;
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
    response = await fetchExternal(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings.extraBody,
        model: settings.model,
        messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.6,
      }),
    }, { fetchFn, service: settings.id, timeoutMs: settings.timeoutMs });
  } catch (error) {
    if (error instanceof ExternalFailure && error.kind === "timeout") {
      throw new ProviderFailure("timeout");
    }
    if (error instanceof ExternalFailure && error.kind === "rate_limited") {
      throw new ProviderFailure("rate_limited", error.retryAfterMs);
    }
    throw new ProviderFailure("http_error");
  }
  try {
    return readCompletion(await response.json());
  } catch (error) {
    if (error instanceof ProviderFailure) throw error;
    throw new ProviderFailure("invalid_response");
  }
}
