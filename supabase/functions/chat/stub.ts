import { PROMPT_VERSION } from "./prompt.ts";
import type { QuestionProvider } from "./provider.ts";

export const stubProvider: QuestionProvider = {
  answer: () =>
    Promise.resolve({
      text: "Réponse de test déterministe : aucune lecture réelle n'a été générée.",
      provider: "stub",
      model: "stub",
      promptVersion: PROMPT_VERSION,
    }),
};
