import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  linkAnonymousAccountWithProvider,
  resendUpgradeConfirmation,
  toUpgradeError,
  upgradeAnonymousAccount,
} from "../lib/accountUpgrade";
import { supabase } from "../lib/supabaseClient";
import { useAccountUpgrade } from "./useAccountUpgrade";

vi.mock("../lib/supabaseClient", () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() } },
}));

vi.mock("../lib/accountUpgrade", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/accountUpgrade")>();
  return {
    ...actual,
    upgradeAnonymousAccount: vi.fn(),
    resendUpgradeConfirmation: vi.fn(),
    linkAnonymousAccountWithProvider: vi.fn(),
  };
});

type AuthListener = (event: string, session: unknown) => void;
let emitAuthChange: AuthListener = () => undefined;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(((listener: AuthListener) => {
    emitAuthChange = listener;
    return { data: { subscription: { unsubscribe } } };
  }) as never);
});

afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("useAccountUpgrade", () => {
  it("waits for the email confirmation after a successful submission", async () => {
    vi.mocked(upgradeAnonymousAccount).mockResolvedValue({ status: "confirmation_sent", error: null });

    const { result } = renderHook(() => useAccountUpgrade({ redirectTo: "https://numa.test/m" }));

    await act(async () => {
      await result.current.upgrade("luna@example.com");
    });

    expect(result.current.step).toBe("confirmation_sent");
    expect(result.current.email).toBe("luna@example.com");
    expect(upgradeAnonymousAccount).toHaveBeenCalledWith("luna@example.com", {
      redirectTo: "https://numa.test/m",
    });
  });

  it("goes back to idle with the error when the email is already used", async () => {
    vi.mocked(upgradeAnonymousAccount).mockResolvedValue({
      status: null,
      error: toUpgradeError("email_already_used"),
    });

    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.upgrade("taken@example.com");
    });

    expect(result.current.step).toBe("idle");
    expect(result.current.error?.code).toBe("email_already_used");
    expect(result.current.error?.message).toBe(
      "Cette adresse est déjà associée à un compte. Connectez-vous avec ce compte ou utilisez une autre adresse.",
    );
  });

  it("clears the error on a successful retry after a network failure", async () => {
    vi.mocked(upgradeAnonymousAccount)
      .mockResolvedValueOnce({ status: null, error: toUpgradeError("network") })
      .mockResolvedValueOnce({ status: "upgraded", error: null });

    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.upgrade("luna@example.com");
    });
    expect(result.current.error?.retryable).toBe(true);

    await act(async () => {
      await result.current.upgrade("luna@example.com");
    });
    expect(result.current.error).toBeNull();
    expect(result.current.step).toBe("upgraded");
  });

  it("resends the link to the address already submitted", async () => {
    vi.mocked(upgradeAnonymousAccount).mockResolvedValue({ status: "confirmation_sent", error: null });
    vi.mocked(resendUpgradeConfirmation).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.upgrade("luna@example.com");
    });
    await act(async () => {
      await result.current.resend();
    });

    expect(resendUpgradeConfirmation).toHaveBeenCalledWith("luna@example.com", { redirectTo: undefined });
    expect(result.current.step).toBe("confirmation_sent");
  });

  it("does nothing on resend before any submission", async () => {
    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.resend();
    });

    expect(resendUpgradeConfirmation).not.toHaveBeenCalled();
    expect(result.current.step).toBe("idle");
  });

  it("keeps waiting for confirmation and surfaces a failed resend", async () => {
    vi.mocked(upgradeAnonymousAccount).mockResolvedValue({ status: "confirmation_sent", error: null });
    vi.mocked(resendUpgradeConfirmation).mockResolvedValue({ error: toUpgradeError("rate_limited") });

    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.upgrade("luna@example.com");
    });
    await act(async () => {
      await result.current.resend();
    });

    expect(result.current.step).toBe("confirmation_sent");
    expect(result.current.error?.code).toBe("rate_limited");
  });

  it("surfaces an OAuth linking failure", async () => {
    vi.mocked(linkAnonymousAccountWithProvider).mockResolvedValue({
      error: toUpgradeError("identity_already_linked"),
    });

    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.linkProvider("google");
    });

    expect(result.current.step).toBe("idle");
    expect(result.current.error?.code).toBe("identity_already_linked");
  });

  it("stays submitting while the browser redirects to the OAuth provider", async () => {
    vi.mocked(linkAnonymousAccountWithProvider).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAccountUpgrade());

    await act(async () => {
      await result.current.linkProvider("google");
    });

    expect(result.current.step).toBe("submitting");
    expect(result.current.error).toBeNull();
  });

  it("switches to upgraded when Supabase reports a permanent user", () => {
    const { result } = renderHook(() => useAccountUpgrade());

    act(() => {
      emitAuthChange("USER_UPDATED", { user: { id: "user-1", is_anonymous: false } });
    });

    expect(result.current.step).toBe("upgraded");
  });

  it("ignores auth events of a still anonymous user", () => {
    const { result } = renderHook(() => useAccountUpgrade());

    act(() => {
      emitAuthChange("TOKEN_REFRESHED", { user: { id: "user-1", is_anonymous: true } });
    });

    expect(result.current.step).toBe("idle");
  });

  it("exposes an expired confirmation link found in the URL", () => {
    window.history.replaceState(null, "", "/migration#error=access_denied&error_code=otp_expired");

    const { result } = renderHook(() => useAccountUpgrade());

    expect(result.current.error?.code).toBe("link_expired");
  });

  it("unsubscribes from auth changes on unmount", () => {
    const { unmount } = renderHook(() => useAccountUpgrade());

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
