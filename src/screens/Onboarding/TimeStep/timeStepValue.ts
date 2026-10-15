// Provisoire : le type de précision définitif est porté par #18.
export type BirthTimePrecision = "exact" | "approximate" | "unknown";

export type BirthTimeMargin = "under-30-min" | "30-min-to-2-h" | "over-2-h";

export interface TimeStepValue {
  precision: BirthTimePrecision | null;
  time?: string;
  margin?: BirthTimeMargin;
}

export const birthTimeMarginLabels: Record<BirthTimeMargin, string> = {
  "under-30-min": "< 30 min",
  "30-min-to-2-h": "30 min–2 h",
  "over-2-h": "> 2 h",
};

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

// L'heure saisie survit au passage exacte ↔ approximative ; « inconnue » efface tout pour ne
// pas transmettre à l'écran résultat une heure que l'utilisateur a désavouée.
export function withPrecision(value: TimeStepValue, precision: BirthTimePrecision): TimeStepValue {
  if (precision === "unknown") return { precision };
  const next: TimeStepValue = { precision };
  if (value.time !== undefined) next.time = value.time;
  if (precision === "approximate" && value.margin !== undefined) next.margin = value.margin;
  return next;
}
