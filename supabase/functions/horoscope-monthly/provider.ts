import { logEvent } from "../_shared/logger.ts";
import { ProviderFailure, requestCompletion } from "../chat/completion.ts";
import type { ProviderSettings } from "../chat/config.ts";
import { finalizeAnswer } from "../chat/validate.ts";
import { type HoroscopeSections, parseSections } from "../horoscope/sections.ts";
import type { MonthlyFactors } from "./context.ts";
import { buildMessages, MONTHLY_PROMPT_VERSION } from "./prompt.ts";

export interface GeneratedMonthly {
  sections: HoroscopeSections;
  provider: string;
  model: string;
  promptVersion: string;
}

export interface MonthlyProvider {
  generate(factors: MonthlyFactors): Promise<GeneratedMonthly | null>;
}

export interface MonthlyChainOptions {
  providers: ProviderSettings[];
  getApiKey: (name: string) => string | undefined;
  fetchFn: typeof fetch;
}

export function createMonthlyChain(options: MonthlyChainOptions): MonthlyProvider {
  return {
    async generate(factors) {
      const messages = buildMessages(factors);

      for (const settings of options.providers) {
        const apiKey = options.getApiKey(settings.apiKeyEnv);
        if (!settings.enabled || !apiKey) continue;

        try {
          const text = finalizeAnswer(
            await requestCompletion(options.fetchFn, settings, apiKey, messages),
          );
          const sections = text === null ? null : parseSections(text);
          if (sections === null) throw new ProviderFailure("invalid_response");
          return {
            sections,
            provider: settings.id,
            model: settings.model,
            promptVersion: MONTHLY_PROMPT_VERSION,
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
        }
      }

      return null;
    },
  };
}
