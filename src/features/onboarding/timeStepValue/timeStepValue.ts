import type { TimeMargin, TimePrecision } from "../birthData/birthData";

export interface TimeStepValue {
  precision: TimePrecision | null;
  time?: string;
  margin?: TimeMargin;
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTime(time: string | undefined): boolean {
  return time !== undefined && timePattern.test(time);
}

export function isTimeStepComplete(value: TimeStepValue): boolean {
  switch (value.precision) {
    case "exact":
      return isValidTime(value.time);
    case "approximate":
      return isValidTime(value.time) && value.margin !== undefined;
    case "unknown":
      return true;
    default:
      return false;
  }
}

/**
 * L'heure saisie survit au passage exacte ↔ approximative ; « inconnue » efface tout pour ne
 * pas transmettre à l'écran résultat une heure que l'utilisateur a désavouée.
 */
export function withPrecision(value: TimeStepValue, precision: TimePrecision): TimeStepValue {
  if (precision === "unknown") return { precision };
  const next: TimeStepValue = { precision };
  if (value.time !== undefined) next.time = value.time;
  if (precision === "approximate" && value.margin !== undefined) next.margin = value.margin;
  return next;
}
