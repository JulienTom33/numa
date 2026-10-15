import { afterEach, describe, expect, it, vi } from "vitest";
import { startAnonymousSession } from "./anonymousSession";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: { signInAnonymously: vi.fn() },
    from: vi.fn(),
  },
}));

describe("startAnonymousSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates the anonymous session then upserts the profile", async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    } as never);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const { error } = await startAnonymousSession();

    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(upsert).toHaveBeenCalledWith({ id: "user-1" }, { onConflict: "id" });
  });

  it("returns an error when the anonymous sign-in fails", async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "réseau indisponible" },
    } as never);

    const { error } = await startAnonymousSession();

    expect(error).toEqual({ message: "réseau indisponible" });
  });

  it("returns an error when the profile upsert fails", async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    } as never);
    const upsert = vi.fn().mockResolvedValue({ error: { message: "profil refusé" } });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const { error } = await startAnonymousSession();

    expect(error).toEqual({ message: "profil refusé" });
  });
});
