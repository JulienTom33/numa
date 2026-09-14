import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startAnonymousSession } from "../lib/anonymousSession";
import { supabase } from "../lib/supabaseClient";
import { useAnonymousSession } from "./useAnonymousSession";

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock("../lib/anonymousSession", () => ({
  startAnonymousSession: vi.fn(),
}));

function mockAuthState(session: unknown) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session } } as never);
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  } as never);
}

describe("useAnonymousSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads the persisted session on mount", async () => {
    const session = { user: { id: "user-1", is_anonymous: true } };
    mockAuthState(session);

    const { result } = renderHook(() => useAnonymousSession());

    await waitFor(() => expect(result.current.session).toBe(session));
    expect(result.current.isAnonymous).toBe(true);
  });

  it("has no session and is not anonymous when nothing is persisted", async () => {
    mockAuthState(null);

    const { result } = renderHook(() => useAnonymousSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.isAnonymous).toBe(false);
  });

  it("surfaces the error from startAnonymousSession without throwing", async () => {
    mockAuthState(null);
    vi.mocked(startAnonymousSession).mockResolvedValue({
      error: { message: "réseau indisponible" },
    });

    const { result } = renderHook(() => useAnonymousSession());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe("réseau indisponible");
    expect(result.current.loading).toBe(false);
  });

  it("clears a previous error on a successful retry", async () => {
    mockAuthState(null);
    vi.mocked(startAnonymousSession).mockResolvedValueOnce({
      error: { message: "réseau indisponible" },
    });

    const { result } = renderHook(() => useAnonymousSession());

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe("réseau indisponible");

    vi.mocked(startAnonymousSession).mockResolvedValueOnce({ error: null });

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBeNull();
  });
});
