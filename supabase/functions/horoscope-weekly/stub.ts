import { WEEKLY_PROMPT_VERSION } from "./prompt.ts";
import type { WeeklyProvider } from "./provider.ts";

export const stubWeeklyProvider: WeeklyProvider = {
  generate: () =>
    Promise.resolve({
      sections: {
        general: "Lecture de test déterministe : la semaine peut inviter à la douceur.",
        relations: "Lecture de test déterministe : le dialogue tend à être plus fluide.",
        work: "Lecture de test déterministe : vous pouvez avancer pas à pas.",
        energy: "Lecture de test déterministe : votre énergie peut rester stable.",
      },
      provider: "stub",
      model: "stub",
      promptVersion: WEEKLY_PROMPT_VERSION,
    }),
};
