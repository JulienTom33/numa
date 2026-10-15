import { normalizeBirthTime, TIME_MARGINS, type OnboardingData, type TimeMargin, type TimePrecision } from "./birthData";
import { supabase } from "./supabaseClient";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export const ONBOARDING_STEP_COUNT = 5;

export interface OnboardingDraft {
  step: OnboardingStep;
  data: OnboardingData;
}

/** Ligne de public.onboarding_drafts (hors colonnes gérées par la base). */
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
}

/** Message volontairement générique : le détail technique Supabase ne doit pas être montré à l'utilisateur. */
export const SAVE_ERROR_MESSAGE = "Vos informations n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez.";
export const LOAD_ERROR_MESSAGE = "Votre saisie précédente n'a pas pu être récupérée. Vous pouvez reprendre depuis le début.";

const DRAFT_COLUMNS =
  "user_id, current_step, first_name, birth_date, birth_time, time_precision, time_margin, birth_place, latitude, longitude, timezone";

function toStep(value: number): OnboardingStep {
  return Math.min(Math.max(Math.trunc(value), 1), ONBOARDING_STEP_COUNT) as OnboardingStep;
}

function toPrecision(value: string | null): TimePrecision | null {
  return value === "exact" || value === "approximate" || value === "unknown" ? value : null;
}

function toMargin(value: string | null): TimeMargin | null {
  return TIME_MARGINS.find((margin) => margin === value) ?? null;
}

export function draftToRow(userId: string, draft: OnboardingDraft): OnboardingDraftRow {
  const { data } = draft;
  const birthTime = normalizeBirthTime(data.birthTime);
  const firstName = data.firstName.trim();
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
  };
}

export interface LoadedOnboardingDraft {
  draft: OnboardingDraft | null;
  /** Renseigné si l'onboarding a déjà été finalisé au moins une fois. */
  birthDataId: string | null;
  error: string | null;
}

export async function loadOnboardingDraft(userId: string): Promise<LoadedOnboardingDraft> {
  const { data, error } = await supabase
    .from("onboarding_drafts")
    .select(`${DRAFT_COLUMNS}, birth_data_id`)
    .eq("user_id", userId)
    .maybeSingle<OnboardingDraftRow & { birth_data_id: string | null }>();

  if (error) {
    return { draft: null, birthDataId: null, error: LOAD_ERROR_MESSAGE };
  }
  return { draft: data ? rowToDraft(data) : null, birthDataId: data?.birth_data_id ?? null, error: null };
}

export async function saveOnboardingDraft(userId: string, draft: OnboardingDraft): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("onboarding_drafts")
    .upsert(draftToRow(userId, draft), { onConflict: "user_id" });

  return { error: error ? SAVE_ERROR_MESSAGE : null };
}

/** Finalise côté base (transaction unique) : prénom dans le profil, données dans birth_data. */
export async function completeOnboarding(): Promise<{ birthDataId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("complete_onboarding");

  if (error || typeof data !== "string") {
    return { birthDataId: null, error: SAVE_ERROR_MESSAGE };
  }
  return { birthDataId: data, error: null };
}
