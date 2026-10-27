import { HttpError } from "../_shared/http.ts";
import { ProviderFailure, requestCompletion } from "../chat/completion.ts";
import type { ProviderSettings } from "../chat/config.ts";
import { finalizeAnswer } from "../chat/validate.ts";
import type { HoroscopeFactors } from "./context.ts";
import { buildMessages, HOROSCOPE_PROMPT_VERSION } from "./prompt.ts";
import { type HoroscopeSections, parseSections } from "./sections.ts";

export interface GeneratedHoroscope {
  sections: HoroscopeSections;
  provider: string;
  model: string;
  promptVersion: string;
}

export interface HoroscopeProvider {
  generate(factors: HoroscopeFactors): Promise<GeneratedHoroscope>;
}

export interface HoroscopeChainOptions {
  providers: ProviderSettings[];
  getApiKey: (name: string) => string | undefined;
  fetchFn: typeof fetch;
}

export function createHoroscopeChain(options: HoroscopeChainOptions): HoroscopeProvider {
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
            promptVersion: HOROSCOPE_PROMPT_VERSION,
          };
        } catch (error) {
          const failure = error instanceof ProviderFailure
            ? error
            : new ProviderFailure("http_error");
          console.error("ai_provider_failure", settings.id, failure.kind);
        }
      }

      throw new HttpError(503, "ai_unavailable", "ai_unavailable");
    },
  };
}
