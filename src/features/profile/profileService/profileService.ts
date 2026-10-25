import type { Tables } from "../../../../shared/database.types";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { TIME_MARGINS, type BirthTimeInput, type TimePrecision } from "../../onboarding/birthData/birthData";
import {
  ACCOUNT_STATUSES,
  PROFILE_LANGUAGES,
  PROFILE_TONES,
  findOption,
  type ProfileBirth,
  type ProfileData,
  type ProfileErrorCode,
  type ProfileUpdate,
} from "../profileData/profileData";

const TIME_PRECISIONS: readonly TimePrecision[] = ["exact", "approximate", "unknown"];

type ProfileRow = Pick<Tables<"profiles">, "display_name" | "status" | "language" | "tone">;
type BirthRow = Pick<
  Tables<"birth_data">,
  | "id"
  | "birth_date"
  | "birth_time"
  | "time_precision"
  | "time_margin"
  | "birth_place"
  | "latitude"
  | "longitude"
  | "timezone"
>;

export interface ProfileResult {
  data: ProfileData | null;
  error: ProfileErrorCode | null;
}

function toBirthTime(row: BirthRow): BirthTimeInput {
  return {
    precision: findOption(TIME_PRECISIONS, row.time_precision),
    time: row.birth_time ? row.birth_time.slice(0, 5) : "",
    margin: findOption(TIME_MARGINS, row.time_margin),
  };
}

function toBirth(row: BirthRow): ProfileBirth {
  return {
    id: row.id,
    birthDate: row.birth_date,
    birthTime: toBirthTime(row),
    birthPlace: {
      label: row.birth_place,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      timezone: row.timezone,
    },
  };
}

export function toProfileData(userId: string, profile: ProfileRow, birth: BirthRow): ProfileData {
  return {
    userId,
    firstName: profile.display_name ?? "",
    status: findOption(ACCOUNT_STATUSES, profile.status) ?? "anonymous",
    language: findOption(PROFILE_LANGUAGES, profile.language) ?? PROFILE_LANGUAGES[0],
    tone: findOption(PROFILE_TONES, profile.tone) ?? "balanced",
    birth: toBirth(birth),
  };
}

export async function fetchProfile(userId: string): Promise<ProfileResult> {
  const [profile, birth] = await Promise.all([
    supabase.from("profiles").select("display_name, status, language, tone").eq("id", userId).maybeSingle(),
    supabase
      .from("birth_data")
      .select("id, birth_date, birth_time, time_precision, time_margin, birth_place, latitude, longitude, timezone")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (profile.error || birth.error) return { data: null, error: "network_error" };
  if (!profile.data) return { data: null, error: "profile_not_found" };
  if (!birth.data) return { data: null, error: "birth_data_not_found" };
  return { data: toProfileData(userId, profile.data, birth.data), error: null };
}

export async function saveProfile(
  profile: ProfileData,
  update: ProfileUpdate,
): Promise<{ error: ProfileErrorCode | null }> {
  const preferences = await supabase
    .from("profiles")
    .update({ display_name: update.firstName, language: update.language, tone: update.tone })
    .eq("id", profile.userId);
  if (preferences.error) return { error: "save_failed" };
  if (update.birth === null) return { error: null };

  const { birthDate, birthTime, birthPlace } = update.birth;
  const birth = await supabase
    .from("birth_data")
    .update({
      birth_date: birthDate,
      birth_time: birthTime.precision === "unknown" || birthTime.time === "" ? null : birthTime.time,
      time_precision: birthTime.precision ?? "unknown",
      time_margin: birthTime.margin,
      birth_place: birthPlace.label,
      latitude: birthPlace.latitude,
      longitude: birthPlace.longitude,
      timezone: birthPlace.timezone,
      declared_ascendant_sign: null,
      ascendant_source: null,
    })
    .eq("id", profile.birth.id);
  return { error: birth.error ? "save_failed" : null };
}

export function applyUpdate(profile: ProfileData, update: ProfileUpdate): ProfileData {
  return {
    ...profile,
    firstName: update.firstName,
    language: update.language,
    tone: update.tone,
    birth: update.birth ? { id: profile.birth.id, ...update.birth } : profile.birth,
  };
}
