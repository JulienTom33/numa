import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  linkProvider,
  markPendingConversion,
  readPendingConversion,
  resendUpgradeLink,
  sendMagicLink,
  sendUpgradeLink,
  signInWithProvider,
  signOut,
} from "../auth/auth";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { useAuth } from "./useAuth";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: { auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() } },
}));

vi.mock("../auth/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../auth/auth")>();
  return {
    ...actual,
    sendMagicLink: vi.fn().mockResolvedValue({ error: null }),
    sendUpgradeLink: vi.fn().mockResolvedValue({ error: null }),
    resendUpgradeLink: vi.fn().mockResolvedValue({ error: null }),
    signInWithProvider: vi.fn().mockResolvedValue({ error: null }),
    linkProvider: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
});

type AuthListener = (event: string, session: unknown) => void;
let emitAuthChange: AuthListener = () => undefined;
const unsubscribe = vi.fn();

const anonymousSession = { user: { id: "anon-1", is_anonymous: true } };
const convertedSession = { user: { id: "anon-1", is_anonymous: false } };
const otherAccountSession = { user: { id: "account-2", is_anonymous: false } };
const redirectTo = "https://numa.test/";

function mockPersistedSession(session: unknown) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session }, error: null } as never);
}

async function renderAuth(session: unknown = null) {
  mockPersistedSession(session);
  const rendered = renderHook(() => useAuth({ redirectTo }));
  await waitFor(() => expect(rendered.result.current.status).not.toBe("loading"));
  return rendered;
}

beforeEach(() => {
  vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(((listener: AuthListener) => {
    emitAuthChange = listener;
    return { data: { subscription: { unsubscribe } } };
  }) as never);
});

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("useAuth", () => {
  it("is loading until the persisted session is read", () => {
    vi.mocked(supabase.auth.getSession).mockReturnValue(new Promise(() => undefined) as never);

    const { result } = renderHook(() => useAuth());

    expect(result.current.status).toBe("loading");
  });

  it("restores the persisted session after a reload", async () => {
    const { result } = await renderAuth(convertedSession);

    expect(result.current.status).toBe("authenticated");
    expect(result.current.session).toEqual(convertedSession);
  });

  it("reports a signed out visitor and an anonymous session", async () => {
    const { result } = await renderAuth(null);
    expect(result.current.status).toBe("signed_out");

    act(() => emitAuthChange("SIGNED_IN", anonymousSession));
    expect(result.current.status).toBe("anonymous");
  });

  it("follows auth state changes and unsubscribes on unmount", async () => {
    const { result, unmount } = await renderAuth(convertedSession);

    act(() => emitAuthChange("SIGNED_OUT", null));
    expect(result.current.status).toBe("signed_out");

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("sends a regular magic link when no anonymous session exists", async () => {
    const { result } = await renderAuth(null);

    let error: unknown;
    await act(async () => {
      error = await result.current.sendMagicLink("luna@example.com", "signup");
    });

    expect(error).toBeNull();
    expect(sendMagicLink).toHaveBeenCalledWith("luna@example.com", { redirectTo });
    expect(sendUpgradeLink).not.toHaveBeenCalled();
  });

  it("upgrades the anonymous user on sign up and flags the conversion", async () => {
    const { result } = await renderAuth(anonymousSession);

    await act(async () => {
      await result.current.sendMagicLink("luna@example.com", "signup");
    });

    expect(sendUpgradeLink).toHaveBeenCalledWith("luna@example.com", { redirectTo });
    expect(sendMagicLink).not.toHaveBeenCalled();
    expect(readPendingConversion()).toBe("anon-1");
    expect(result.current.converted).toBe(false);

    act(() => emitAuthChange("USER_UPDATED", convertedSession));

    expect(result.current.status).toBe("authenticated");
    expect(result.current.converted).toBe(true);

    act(() => result.current.acknowledgeConversion());

    expect(result.current.converted).toBe(false);
    expect(readPendingConversion()).toBeNull();
  });

  it("forgets the pending conversion when the upgrade fails", async () => {
    vi.mocked(sendUpgradeLink).mockResolvedValueOnce({ error: { code: "email_already_used", retryable: false } });
    const { result } = await renderAuth(anonymousSession);

    let error: unknown;
    await act(async () => {
      error = await result.current.sendMagicLink("taken@example.com", "signup");
    });

    expect(error).toEqual({ code: "email_already_used", retryable: false });
    expect(readPendingConversion()).toBeNull();
  });

  it("detects a conversion confirmed before a reload", async () => {
    markPendingConversion("anon-1");

    const { result } = await renderAuth(convertedSession);

    expect(result.current.converted).toBe(true);
  });

  it("signs an anonymous user in to an existing account without converting", async () => {
    const { result } = await renderAuth(anonymousSession);

    await act(async () => {
      await result.current.sendMagicLink("luna@example.com", "signin");
    });
    expect(sendMagicLink).toHaveBeenCalledWith("luna@example.com", { redirectTo });
    expect(sendUpgradeLink).not.toHaveBeenCalled();

    act(() => emitAuthChange("SIGNED_IN", otherAccountSession));

    expect(result.current.status).toBe("authenticated");
    expect(result.current.converted).toBe(false);
  });

  it("drops a stale pending conversion when another account signs in", async () => {
    markPendingConversion("anon-1");

    await renderAuth(otherAccountSession);

    await waitFor(() => expect(readPendingConversion()).toBeNull());
  });

  it("resends through the upgrade path only for an anonymous sign up", async () => {
    const { result } = await renderAuth(anonymousSession);

    await act(async () => {
      await result.current.resendMagicLink("luna@example.com", "signup");
      await result.current.resendMagicLink("luna@example.com", "signin");
    });

    expect(resendUpgradeLink).toHaveBeenCalledWith("luna@example.com", { redirectTo });
    expect(sendMagicLink).toHaveBeenCalledTimes(1);
  });

  it("links the OAuth identity for an anonymous sign up", async () => {
    const { result } = await renderAuth(anonymousSession);

    await act(async () => {
      await result.current.signInWithProvider("google", "signup");
    });

    expect(linkProvider).toHaveBeenCalledWith("google", { redirectTo });
    expect(signInWithProvider).not.toHaveBeenCalled();
    expect(readPendingConversion()).toBe("anon-1");
  });

  it("forgets the pending conversion when the identity link fails", async () => {
    vi.mocked(linkProvider).mockResolvedValueOnce({ error: { code: "provider_unavailable", retryable: false } });
    const { result } = await renderAuth(anonymousSession);

    let error: unknown;
    await act(async () => {
      error = await result.current.signInWithProvider("apple", "signup");
    });

    expect(error).toEqual({ code: "provider_unavailable", retryable: false });
    expect(readPendingConversion()).toBeNull();
  });

  it("uses the regular OAuth sign in otherwise", async () => {
    const { result } = await renderAuth(anonymousSession);

    await act(async () => {
      await result.current.signInWithProvider("apple", "signin");
    });

    expect(signInWithProvider).toHaveBeenCalledWith("apple", { redirectTo });
    expect(linkProvider).not.toHaveBeenCalled();
  });

  it("signs out", async () => {
    const { result } = await renderAuth(convertedSession);

    let error: unknown;
    await act(async () => {
      error = await result.current.signOut();
    });

    expect(error).toBeNull();
    expect(signOut).toHaveBeenCalled();
  });

  it("reads the redirect error, cleans the URL and lets it be dismissed", async () => {
    window.history.replaceState(null, "", "/#error=access_denied&error_code=otp_expired");

    const { result } = await renderAuth(null);

    expect(result.current.redirectError).toEqual({ code: "link_expired", retryable: false });
    expect(window.location.hash).toBe("");

    act(() => result.current.dismissRedirectError());
    expect(result.current.redirectError).toBeNull();
  });

  it("defaults the redirect URL to the app root", async () => {
    mockPersistedSession(null);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.status).toBe("signed_out"));

    await act(async () => {
      await result.current.sendMagicLink("luna@example.com", "signin");
    });

    expect(sendMagicLink).toHaveBeenCalledWith("luna@example.com", {
      redirectTo: `${window.location.origin}/`,
    });
  });
});
