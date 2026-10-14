import { afterEach, describe, expect, it, vi } from "vitest";
import { incrementAnonymousQuestionCount, startAnonymousSession } from "./anonymousSession";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: { signInAnonymously: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
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

describe("incrementAnonymousQuestionCount", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the updated count on success", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 1, error: null } as never);

    const { count, error } = await incrementAnonymousQuestionCount();

    expect(count).toBe(1);
    expect(error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "increment_usage_counter",
      expect.objectContaining({ p_period_start: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
    );
  });

  it("returns an error when the rpc call fails", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: "quota indisponible" },
    } as never);

    const { count, error } = await incrementAnonymousQuestionCount();

    expect(count).toBeNull();
    expect(error).toEqual({ message: "quota indisponible" });
  });
});
