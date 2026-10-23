import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthRedirectError,
  clearPendingConversion,
  defaultAuthRedirectUrl,
  fromUpgradeError,
  linkProvider,
  mapSupabaseAuthError,
  markPendingConversion,
  PENDING_CONVERSION_STORAGE_KEY,
  readAuthRedirectError,
  readPendingConversion,
  resendUpgradeLink,
  sendMagicLink,
  sendUpgradeLink,
  signInWithProvider,
  signOut,
} from "./auth";
import { toUpgradeError } from "../accountUpgrade/accountUpgrade";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resend: vi.fn(),
      linkIdentity: vi.fn(),
    },
  },
}));

const apiError = (code: string, status = 422) => new AuthApiError("technical detail", status, code);

function mockAnonymousUser() {
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: "anon-1", is_anonymous: true } },
    error: null,
  } as never);
}

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("mapSupabaseAuthError", () => {
  it.each([
    ["email_exists", "email_already_used"],
    ["identity_already_exists", "identity_already_linked"],
    ["email_address_invalid", "invalid_email"],
    ["otp_expired", "link_expired"],
    ["over_email_send_rate_limit", "rate_limited"],
    ["manual_linking_disabled", "provider_unavailable"],
    ["provider_disabled", "provider_unavailable"],
    ["otp_disabled", "provider_unavailable"],
    ["session_not_found", "session_expired"],
    ["weak_password", "unknown"],
    ["something_new", "unknown"],
  ])("maps the Supabase code %s to %s", (supabaseCode, expected) => {
    expect(mapSupabaseAuthError(apiError(supabaseCode)).code).toBe(expected);
  });

  it("never keeps the technical message", () => {
    expect(mapSupabaseAuthError(apiError("otp_expired"))).toEqual({ code: "link_expired", retryable: false });
  });

  it("treats a fetch failure as a retryable network error", () => {
    expect(mapSupabaseAuthError(new AuthRetryableFetchError("Failed to fetch", 0))).toEqual({
      code: "network",
      retryable: true,
    });
  });
});

describe("fromUpgradeError", () => {
  it("maps the account upgrade codes onto the auth flow codes", () => {
    expect(fromUpgradeError(toUpgradeError("no_session")).code).toBe("session_expired");
    expect(fromUpgradeError(toUpgradeError("not_anonymous")).code).toBe("unknown");
    expect(fromUpgradeError(toUpgradeError("rate_limited"))).toEqual({ code: "rate_limited", retryable: true });
  });
});

describe("defaultAuthRedirectUrl", () => {
  it("points to the app root", () => {
    expect(defaultAuthRedirectUrl()).toBe(`${window.location.origin}/`);
  });
});

describe("sendMagicLink", () => {
  it("requests an OTP link with the redirect URL and account creation allowed", async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: {}, error: null } as never);

    const result = await sendMagicLink("  luna@example.com ", { redirectTo: "https://numa.test/" });

    expect(result.error).toBeNull();
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "luna@example.com",
      options: { emailRedirectTo: "https://numa.test/", shouldCreateUser: true },
    });
  });

  it("returns a typed error", async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: apiError("over_email_send_rate_limit", 429),
    } as never);

    expect((await sendMagicLink("luna@example.com")).error?.code).toBe("rate_limited");
  });
});

describe("signInWithProvider", () => {
  it("starts the OAuth redirect with the provider", async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: {}, error: null } as never);

    const result = await signInWithProvider("apple", { redirectTo: "https://numa.test/" });

    expect(result.error).toBeNull();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "apple",
      options: { redirectTo: "https://numa.test/" },
    });
  });

  it("reports a disabled provider", async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: {},
      error: apiError("provider_disabled", 400),
    } as never);

    expect((await signInWithProvider("google")).error?.code).toBe("provider_unavailable");
  });
});

describe("anonymous account upgrade", () => {
  it("attaches the email to the anonymous user instead of creating an account", async () => {
    mockAnonymousUser();
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: "anon-1", is_anonymous: true } },
      error: null,
    } as never);

    const result = await sendUpgradeLink("luna@example.com", { redirectTo: "https://numa.test/" });

    expect(result.error).toBeNull();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith(
      { email: "luna@example.com" },
      { emailRedirectTo: "https://numa.test/" },
    );
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("maps an email already used by another account", async () => {
    mockAnonymousUser();
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: apiError("email_exists"),
    } as never);

    expect((await sendUpgradeLink("taken@example.com")).error?.code).toBe("email_already_used");
  });

  it("resends the upgrade confirmation", async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: null } as never);

    expect((await resendUpgradeLink("luna@example.com")).error).toBeNull();
    expect(supabase.auth.resend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "email_change", email: "luna@example.com" }),
    );
  });

  it("maps a failed resend", async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({
      data: {},
      error: new AuthRetryableFetchError("Failed to fetch", 0),
    } as never);

    expect((await resendUpgradeLink("luna@example.com")).error?.code).toBe("network");
  });

  it("links an OAuth identity to the anonymous user", async () => {
    mockAnonymousUser();
    vi.mocked(supabase.auth.linkIdentity).mockResolvedValue({ data: {}, error: null } as never);

    expect((await linkProvider("google", { redirectTo: "https://numa.test/" })).error).toBeNull();
    expect(supabase.auth.linkIdentity).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://numa.test/" },
    });
  });

  it("maps a failed identity link", async () => {
    mockAnonymousUser();
    vi.mocked(supabase.auth.linkIdentity).mockResolvedValue({
      data: {},
      error: apiError("identity_already_exists"),
    } as never);

    expect((await linkProvider("google")).error?.code).toBe("identity_already_linked");
  });
});

describe("signOut", () => {
  it("signs out", async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never);

    expect((await signOut()).error).toBeNull();
  });

  it("returns a typed error", async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: new AuthRetryableFetchError("Failed to fetch", 0),
    } as never);

    expect((await signOut()).error?.code).toBe("network");
  });
});

describe("redirect errors", () => {
  it("reads the error placed in the URL fragment", () => {
    expect(
      readAuthRedirectError("https://numa.test/#error=access_denied&error_code=otp_expired")?.code,
    ).toBe("link_expired");
  });

  it("returns null without error", () => {
    expect(readAuthRedirectError("https://numa.test/")).toBeNull();
  });

  it("removes only the error parameters from the current URL", () => {
    window.history.replaceState(
      null,
      "",
      "/?tab=today&error=access_denied#error_code=otp_expired&error_description=Expired",
    );

    clearAuthRedirectError();

    expect(window.location.search).toBe("?tab=today");
    expect(window.location.hash).toBe("");
  });
});

describe("pending conversion", () => {
  it("stores, reads and clears the anonymous user id", () => {
    expect(readPendingConversion()).toBeNull();

    markPendingConversion("anon-1");
    expect(window.localStorage.getItem(PENDING_CONVERSION_STORAGE_KEY)).toBe("anon-1");
    expect(readPendingConversion()).toBe("anon-1");

    clearPendingConversion();
    expect(readPendingConversion()).toBeNull();
  });

  it("tolerates an unavailable storage", () => {
    const spies = [
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      }),
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      }),
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("blocked");
      }),
    ];

    expect(() => markPendingConversion("anon-1")).not.toThrow();
    expect(readPendingConversion()).toBeNull();
    expect(() => clearPendingConversion()).not.toThrow();

    spies.forEach((spy) => spy.mockRestore());
  });
});
