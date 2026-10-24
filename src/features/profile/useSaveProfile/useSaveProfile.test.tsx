import type { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import { createQueryWrapper, createTestQueryClient } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { authenticatedProfile } from "../profileData/profileFixtures";
import { profileQueryKeys } from "../profileQueries/profileQueries";
import { saveProfile } from "../profileService/profileService";
import { useSaveProfile } from "./useSaveProfile";

vi.mock("../profileService/profileService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../profileService/profileService")>()),
  saveProfile: vi.fn(),
}));

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

const BIRTH = { ...authenticatedProfile.birth, birthDate: "1991-01-01" };

function setup(client: QueryClient) {
  client.setQueryData(profileQueryKeys.mine("user-1"), authenticatedProfile);
  client.setQueryData(queryKeys.chart.mine(), { stale: false });
  return renderHook(() => useSaveProfile(authenticatedProfile), { wrapper: createQueryWrapper(client) });
}

describe("useSaveProfile", () => {
  it("met le cache du profil à jour et invalide le thème quand la naissance change", async () => {
    vi.mocked(saveProfile).mockResolvedValue({ error: null });
    const client = createTestQueryClient();
    const { result } = setup(client);

    let ok = false;
    await act(async () => {
      ok = await result.current.save({ firstName: "Léa", language: "fr", tone: "direct", birth: BIRTH });
    });

    expect(ok).toBe(true);
    expect(client.getQueryData(profileQueryKeys.mine("user-1"))).toMatchObject({ firstName: "Léa" });
    expect(client.getQueryState(queryKeys.chart.mine())?.isInvalidated).toBe(true);
  });

  it("n'invalide pas le thème pour de simples préférences", async () => {
    vi.mocked(saveProfile).mockResolvedValue({ error: null });
    const client = createTestQueryClient();
    const { result } = setup(client);

    await act(async () => {
      await result.current.save({ firstName: "Léa", language: "fr", tone: "direct", birth: null });
    });

    expect(client.getQueryState(queryKeys.chart.mine())?.isInvalidated).toBe(false);
  });

  it("expose le code d'erreur et peut être réinitialisé", async () => {
    vi.mocked(saveProfile).mockResolvedValue({ error: "save_failed" });
    const { result } = setup(createTestQueryClient());

    let ok = true;
    await act(async () => {
      ok = await result.current.save({ firstName: "Léa", language: "fr", tone: "direct", birth: null });
    });
    expect(ok).toBe(false);
    await waitFor(() => expect(result.current.errorCode).toBe("save_failed"));

    act(() => result.current.reset());
    await waitFor(() => expect(result.current.errorCode).toBeNull());
  });
});
