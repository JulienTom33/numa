import { EMPTY_ASCENDANT_CHOICE, type AscendantChoice, type AscendantSource } from "./ascendant";
import { normalizeBirthTime, TIME_MARGINS, type OnboardingData, type TimeMargin, type TimePrecision } from "./birthData";
import { supabase } from "./supabaseClient";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export const ONBOARDING_STEP_COUNT = 5;

export const SUMMARY_STEP = 5;

export const ASCENDANT_STEP = 6;

export interface OnboardingDraft {
  step: OnboardingStep;
  data: OnboardingData;
  ascendant?: AscendantChoice;
}

export interface OnboardingDraftRow {
  user_id: string;
  current_step: number;
  first_name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  time_precision: string | null;
  time_margin: string | null;
  birth_place: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  timezone: string | null;
  ascendant_source: string | null;
  declared_ascendant_sign: string | null;
}

export type OnboardingStoreErrorCode = "save_failed" | "load_failed";

const DRAFT_COLUMNS =
  "user_id, current_step, first_name, birth_date, birth_time, time_precision, time_margin, birth_place, latitude, longitude, timezone, ascendant_source, declared_ascendant_sign";

function toStep(value: number): OnboardingStep {
  return Math.min(Math.max(Math.trunc(value), 1), ASCENDANT_STEP) as OnboardingStep;
}

function toPrecision(value: string | null): TimePrecision | null {
  return value === "exact" || value === "approximate" || value === "unknown" ? value : null;
}

function toMargin(value: string | null): TimeMargin | null {
  return TIME_MARGINS.find((margin) => margin === value) ?? null;
}

function toSource(value: string | null): AscendantSource | null {
  return value === "computed" || value === "declared" ? value : null;
}

function toSign(value: string | null): ZodiacSign | null {
  return ZODIAC_SIGNS.find((sign) => sign === value) ?? null;
}

export function draftToRow(userId: string, draft: OnboardingDraft): OnboardingDraftRow {
  const { data } = draft;
  const birthTime = normalizeBirthTime(data.birthTime);
  const firstName = data.firstName.trim();
  const ascendant = draft.ascendant ?? EMPTY_ASCENDANT_CHOICE;
  const declared = ascendant.source === "declared" && ascendant.declaredSign !== null;
  return {
    user_id: userId,
    current_step: draft.step,
    first_name: firstName === "" ? null : firstName,
    birth_date: data.birthDate,
    birth_time: birthTime.time === "" ? null : birthTime.time,
    time_precision: birthTime.precision,
    time_margin: birthTime.margin,
    birth_place: data.birthPlace?.label ?? null,
    latitude: data.birthPlace?.latitude ?? null,
    longitude: data.birthPlace?.longitude ?? null,
    timezone: data.birthPlace?.timezone ?? null,
    ascendant_source: declared ? "declared" : ascendant.source === "computed" ? "computed" : null,
    declared_ascendant_sign: declared ? ascendant.declaredSign : null,
  };
}

export function rowToDraft(row: OnboardingDraftRow): OnboardingDraft {
  const hasPlace = row.birth_place !== null && row.latitude !== null && row.longitude !== null && row.timezone !== null;
  return {
    step: toStep(row.current_step),
    data: {
      firstName: row.first_name ?? "",
      birthDate: row.birth_date,
      birthTime: {
        precision: toPrecision(row.time_precision),
        time: row.birth_time ? row.birth_time.slice(0, 5) : "",
        margin: toMargin(row.time_margin),
      },
      birthPlace: hasPlace
        ? {
            label: row.birth_place as string,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            timezone: row.timezone as string,
          }
        : null,
    },
    ascendant: { source: toSource(row.ascendant_source), declaredSign: toSign(row.declared_ascendant_sign) },
  };
}

export interface LoadedOnboardingDraft {
  draft: OnboardingDraft | null;
  birthDataId: string | null;
  error: OnboardingStoreErrorCode | null;
}

export async function loadOnboardingDraft(userId: string): Promise<LoadedOnboardingDraft> {
  const { data, error } = await supabase
    .from("onboarding_drafts")
    .select(`${DRAFT_COLUMNS}, birth_data_id`)
    .eq("user_id", userId)
    .maybeSingle<OnboardingDraftRow & { birth_data_id: string | null }>();

  if (error) {
    return { draft: null, birthDataId: null, error: "load_failed" };
  }
  return { draft: data ? rowToDraft(data) : null, birthDataId: data?.birth_data_id ?? null, error: null };
}

export async function saveOnboardingDraft(userId: string, draft: OnboardingDraft): Promise<{ error: OnboardingStoreErrorCode | null }> {
  const { error } = await supabase
    .from("onboarding_drafts")
    .upsert(draftToRow(userId, draft), { onConflict: "user_id" });

  return { error: error ? "save_failed" : null };
}

/** Finalise côté base (transaction unique) : prénom dans le profil, données dans birth_data. */
export async function completeOnboarding(): Promise<{ birthDataId: string | null; error: OnboardingStoreErrorCode | null }> {
  const { data, error } = await supabase.rpc("complete_onboarding");

  if (error || typeof data !== "string") {
    return { birthDataId: null, error: "save_failed" };
  }
  return { birthDataId: data, error: null };
}
