import { MONTHLY_PROMPT_VERSION } from "./prompt.ts";
import type { MonthlyProvider } from "./provider.ts";

export const stubMonthlyProvider: MonthlyProvider = {
  generate: () =>
    Promise.resolve({
      sections: {
        general: "Lecture de test déterministe : le mois peut inviter à la douceur.",
        relations: "Lecture de test déterministe : le dialogue tend à être plus fluide.",
        work: "Lecture de test déterministe : vous pouvez avancer pas à pas.",
        energy: "Lecture de test déterministe : votre énergie peut rester stable.",
      },
      provider: "stub",
      model: "stub",
      promptVersion: MONTHLY_PROMPT_VERSION,
    }),
};
