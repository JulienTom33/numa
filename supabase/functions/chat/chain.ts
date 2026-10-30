import { HttpError } from "../_shared/http.ts";
import { logEvent } from "../_shared/logger.ts";
import type { ProviderSettings } from "./config.ts";
import { ProviderFailure, requestCompletion } from "./completion.ts";
import { buildMessages, PROMPT_VERSION } from "./prompt.ts";
import type { GeneratedAnswer, QuestionProvider } from "./provider.ts";
import { finalizeAnswer } from "./validate.ts";

export const MAX_RETRY_AFTER_MS = 2000;
export const BREAKER_COOLDOWN_MS = 3 * 60 * 1000;
const BREAKER_FAILURE_THRESHOLD = 2;

export interface ChainOptions {
  providers: ProviderSettings[];
  getApiKey: (name: string) => string | undefined;
  fetchFn: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

interface BreakerState {
  failures: number;
  openUntil: number;
}

function isRetryable(failure: ProviderFailure): boolean {
  return failure.kind === "rate_limited" && failure.retryAfterMs !== null &&
    failure.retryAfterMs < MAX_RETRY_AFTER_MS;
}

export function createChainProvider(options: ChainOptions): QuestionProvider {
  const breakers = new Map<string, BreakerState>();

  const stateOf = (id: string): BreakerState => {
    const existing = breakers.get(id);
    if (existing) return existing;
    const created = { failures: 0, openUntil: 0 };
    breakers.set(id, created);
    return created;
  };

  const recordFailure = (id: string, failure: ProviderFailure) => {
    const state = stateOf(id);
    state.failures += 1;
    const unthrottled = failure.kind === "rate_limited" && failure.retryAfterMs === null;
    if (unthrottled || state.failures >= BREAKER_FAILURE_THRESHOLD) {
      state.openUntil = options.now() + BREAKER_COOLDOWN_MS;
      state.failures = 0;
    }
  };

  return {
    async answer({ question, factors }): Promise<GeneratedAnswer> {
      const messages = buildMessages(question, factors);

      for (const settings of options.providers) {
        const apiKey = options.getApiKey(settings.apiKeyEnv);
        if (!settings.enabled || !apiKey) continue;
        if (stateOf(settings.id).openUntil > options.now()) continue;

        for (let tries = 0; tries < 2; tries += 1) {
          try {
            const text = finalizeAnswer(
              await requestCompletion(options.fetchFn, settings, apiKey, messages),
            );
            if (text === null) throw new ProviderFailure("invalid_response");
            stateOf(settings.id).failures = 0;
            return {
              text,
              provider: settings.id,
              model: settings.model,
              promptVersion: PROMPT_VERSION,
            };
          } catch (error) {
            const failure = error instanceof ProviderFailure
              ? error
              : new ProviderFailure("http_error");
            logEvent("error", "ai_provider_failure", {
              provider_kind: "ai",
              service: settings.id,
              kind: failure.kind,
            });
            if (tries === 0 && isRetryable(failure)) {
              await options.sleep(failure.retryAfterMs ?? 0);
              continue;
            }
            recordFailure(settings.id, failure);
            break;
          }
        }
      }

      throw new HttpError(503, "ai_unavailable", "ai_unavailable");
    },
  };
}
