import { describe, expect, it, vi } from "vitest";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { authenticatedProfile } from "../profileData/profileFixtures";
import { applyUpdate, fetchProfile, saveProfile, toProfileData } from "./profileService";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: { from: vi.fn() } }));

const PROFILE_ROW = { display_name: "Camille", status: "authenticated", language: "fr", tone: "gentle" };
const BIRTH_ROW = {
  id: "birth-1",
  birth_date: "1990-03-12",
  birth_time: "14:30:00",
  time_precision: "approximate",
  time_margin: "under_30_min",
  birth_place: "Lyon, France",
  latitude: 45.764043,
  longitude: 4.835659,
  timezone: "Europe/Paris",
};

interface Result {
  data: unknown;
  error: unknown;
}

function mockReads(profile: Result, birth: Result) {
  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    const result = table === "profiles" ? profile : birth;
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve(result),
    };
    return chain;
  }) as never);
}

function mockUpdates(errors: { profiles: unknown; birth_data: unknown }) {
  const spy = vi.fn();
  vi.mocked(supabase.from).mockImplementation(((table: "profiles" | "birth_data") => ({
    update: (values: unknown) => {
      spy(values);
      return { eq: () => Promise.resolve({ error: errors[table] }) };
    },
  })) as never);
  return spy;
}

describe("toProfileData", () => {
  it("convertit les lignes en profil typé, heure tronquée à HH:MM", () => {
    const profile = toProfileData("user-1", PROFILE_ROW, BIRTH_ROW);
    expect(profile.tone).toBe("gentle");
    expect(profile.birth.birthTime).toEqual({ precision: "approximate", time: "14:30", margin: "under_30_min" });
  });

  it("retombe sur des valeurs sûres pour des valeurs inconnues", () => {
    const profile = toProfileData("user-1", { ...PROFILE_ROW, status: "x", language: "x", tone: "x" }, BIRTH_ROW);
    expect([profile.status, profile.language, profile.tone]).toEqual(["anonymous", "fr", "balanced"]);
  });
});

describe("fetchProfile", () => {
  it("renvoie le profil", async () => {
    mockReads({ data: PROFILE_ROW, error: null }, { data: BIRTH_ROW, error: null });
    expect((await fetchProfile("user-1")).data?.firstName).toBe("Camille");
  });

  it("signale les erreurs réseau et les données absentes", async () => {
    mockReads({ data: null, error: { message: "x" } }, { data: BIRTH_ROW, error: null });
    expect((await fetchProfile("user-1")).error).toBe("network_error");
    mockReads({ data: null, error: null }, { data: BIRTH_ROW, error: null });
    expect((await fetchProfile("user-1")).error).toBe("profile_not_found");
    mockReads({ data: PROFILE_ROW, error: null }, { data: null, error: null });
    expect((await fetchProfile("user-1")).error).toBe("birth_data_not_found");
  });
});

describe("saveProfile", () => {
  const update = {
    firstName: "Léa",
    language: "fr" as const,
    tone: "direct" as const,
    birth: { ...authenticatedProfile.birth, birthDate: "1991-01-01" },
  };

  it("met à jour le profil puis la naissance", async () => {
    const spy = mockUpdates({ profiles: null, birth_data: null });
    expect((await saveProfile(authenticatedProfile, update)).error).toBeNull();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("ne touche pas à la naissance si elle est inchangée", async () => {
    const spy = mockUpdates({ profiles: null, birth_data: null });
    await saveProfile(authenticatedProfile, { ...update, birth: null });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("renvoie save_failed en cas d'erreur", async () => {
    mockUpdates({ profiles: { message: "x" }, birth_data: null });
    expect((await saveProfile(authenticatedProfile, update)).error).toBe("save_failed");
    mockUpdates({ profiles: null, birth_data: { message: "x" } });
    expect((await saveProfile(authenticatedProfile, update)).error).toBe("save_failed");
  });
});

describe("applyUpdate", () => {
  it("applique les préférences et conserve la naissance si inchangée", () => {
    const next = applyUpdate(authenticatedProfile, { firstName: "Léa", language: "fr", tone: "direct", birth: null });
    expect(next.firstName).toBe("Léa");
    expect(next.birth).toBe(authenticatedProfile.birth);
  });
});
