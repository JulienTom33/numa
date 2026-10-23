import type { BirthTimeInput } from "../birthData/birthData";
import type { TimeStepValue } from "../timeStepValue/timeStepValue";

/** Convertit l'heure du hook (`""` / `null` pour l'absence) en valeur d'écran (champs optionnels). */
export function toTimeStepValue(input: BirthTimeInput): TimeStepValue {
  const value: TimeStepValue = { precision: input.precision };
  if (input.time !== "") value.time = input.time;
  if (input.margin !== null) value.margin = input.margin;
  return value;
}

/** Convertit la valeur de l'écran d'heure en saisie attendue par `useOnboarding`. */
export function toBirthTimeInput(value: TimeStepValue): BirthTimeInput {
  return {
    precision: value.precision,
    time: value.time ?? "",
    margin: value.margin ?? null,
  };
}
