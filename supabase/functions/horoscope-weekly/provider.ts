import { ProviderFailure, requestCompletion } from "../chat/completion.ts";
import type { ProviderSettings } from "../chat/config.ts";
import { finalizeAnswer } from "../chat/validate.ts";
import { type HoroscopeSections, parseSections } from "../horoscope/sections.ts";
import type { WeeklyFactors } from "./context.ts";
import { buildMessages, WEEKLY_PROMPT_VERSION } from "./prompt.ts";

export interface GeneratedWeekly {
  sections: HoroscopeSections;
  provider: string;
  model: string;
  promptVersion: string;
}

export interface WeeklyProvider {
  generate(factors: WeeklyFactors): Promise<GeneratedWeekly | null>;
}

export interface WeeklyChainOptions {
  providers: ProviderSettings[];
  getApiKey: (name: string) => string | undefined;
  fetchFn: typeof fetch;
}

export function createWeeklyChain(options: WeeklyChainOptions): WeeklyProvider {
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
            promptVersion: WEEKLY_PROMPT_VERSION,
          };
        } catch (error) {
          const failure = error instanceof ProviderFailure
            ? error
            : new ProviderFailure("http_error");
          console.error("ai_provider_failure", settings.id, failure.kind);
        }
      }

      return null;
    },
  };
}
