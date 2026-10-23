import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  linkAnonymousAccountWithProvider,
  mapAuthError,
  readUpgradeRedirectError,
  resendUpgradeConfirmation,
  setAccountPassword,
  upgradeAnonymousAccount,
} from "./accountUpgrade";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resend: vi.fn(),
      linkIdentity: vi.fn(),
    },
  },
}));

function mockCurrentUser(user: { id: string; is_anonymous: boolean } | null, error: unknown = null) {
  vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user }, error } as never);
}

const apiError = (code: string, status = 422) => new AuthApiError("boom", status, code);

afterEach(() => {
  vi.clearAllMocks();
});

describe("mapAuthError", () => {
  it.each([
    ["email_exists", "email_already_used"],
    ["user_already_exists", "email_already_used"],
    ["identity_already_exists", "identity_already_linked"],
    ["email_address_invalid", "invalid_email"],
    ["weak_password", "weak_password"],
    ["otp_expired", "link_expired"],
    ["manual_linking_disabled", "manual_linking_disabled"],
    ["session_not_found", "no_session"],
    ["something_new", "unknown"],
  ])("maps the Supabase code %s to %s", (supabaseCode, expected) => {
    expect(mapAuthError(apiError(supabaseCode)).code).toBe(expected);
  });

  it("treats a fetch failure as a retryable network error", () => {
    const error = mapAuthError(new AuthRetryableFetchError("Failed to fetch", 0));

    expect(error).toEqual(expect.objectContaining({ code: "network", retryable: true }));
  });

  it("treats a missing session as no_session", () => {
    expect(mapAuthError(new AuthSessionMissingError()).code).toBe("no_session");
  });

  it("treats any HTTP 429 as a retryable rate limit", () => {
    const error = mapAuthError(apiError("over_email_send_rate_limit", 429));

    expect(error).toEqual(expect.objectContaining({ code: "rate_limited", retryable: true }));
  });

  it("marks an already used email as not retryable as is", () => {
    expect(mapAuthError(apiError("email_exists")).retryable).toBe(false);
  });
});

describe("upgradeAnonymousAccount", () => {
  it("links the email to the current anonymous user without creating a new user", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: true });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: "user-1", is_anonymous: true } },
      error: null,
    } as never);

    const result = await upgradeAnonymousAccount("  luna@example.com ", {
      redirectTo: "https://numa.test/migration",
    });

    expect(result).toEqual({ status: "confirmation_sent", error: null });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith(
      { email: "luna@example.com" },
      { emailRedirectTo: "https://numa.test/migration" },
    );
  });

  it("reports an immediate upgrade when email confirmation is disabled", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: true });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: "user-1", is_anonymous: false } },
      error: null,
    } as never);

    const result = await upgradeAnonymousAccount("luna@example.com");

    expect(result).toEqual({ status: "upgraded", error: null });
  });

  it("refuses when there is no session", async () => {
    mockCurrentUser(null);

    const result = await upgradeAnonymousAccount("luna@example.com");

    expect(result.error?.code).toBe("no_session");
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("refuses when the user already has a permanent account", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: false });

    const result = await upgradeAnonymousAccount("luna@example.com");

    expect(result.error?.code).toBe("not_anonymous");
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("surfaces a getUser failure", async () => {
    mockCurrentUser(null, new AuthRetryableFetchError("Failed to fetch", 0));

    const result = await upgradeAnonymousAccount("luna@example.com");

    expect(result.error?.code).toBe("network");
  });

  it("reports an email already owned by another account", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: true });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: apiError("email_exists"),
    } as never);

    const result = await upgradeAnonymousAccount("taken@example.com");

    expect(result).toEqual({
      status: null,
      error: expect.objectContaining({ code: "email_already_used" }),
    });
  });
});

describe("resendUpgradeConfirmation", () => {
  it("resends the email change confirmation", async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: {}, error: null } as never);

    const { error } = await resendUpgradeConfirmation("luna@example.com", {
      redirectTo: "https://numa.test/migration",
    });

    expect(error).toBeNull();
    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: "email_change",
      email: "luna@example.com",
      options: { emailRedirectTo: "https://numa.test/migration" },
    });
  });

  it("maps a resend failure", async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({
      data: {},
      error: apiError("over_email_send_rate_limit", 429),
    } as never);

    const { error } = await resendUpgradeConfirmation("luna@example.com");

    expect(error?.code).toBe("rate_limited");
  });
});

describe("linkAnonymousAccountWithProvider", () => {
  it("links the OAuth identity to the current anonymous user", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: true });
    vi.mocked(supabase.auth.linkIdentity).mockResolvedValue({ data: {}, error: null } as never);

    const { error } = await linkAnonymousAccountWithProvider("google", {
      redirectTo: "https://numa.test/migration",
    });

    expect(error).toBeNull();
    expect(supabase.auth.linkIdentity).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://numa.test/migration" },
    });
  });

  it("refuses when the user is not anonymous", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: false });

    const { error } = await linkAnonymousAccountWithProvider("google");

    expect(error?.code).toBe("not_anonymous");
    expect(supabase.auth.linkIdentity).not.toHaveBeenCalled();
  });

  it("reports an identity already linked to another user", async () => {
    mockCurrentUser({ id: "user-1", is_anonymous: true });
    vi.mocked(supabase.auth.linkIdentity).mockResolvedValue({
      data: {},
      error: apiError("identity_already_exists"),
    } as never);

    const { error } = await linkAnonymousAccountWithProvider("google");

    expect(error?.code).toBe("identity_already_linked");
  });
});

describe("setAccountPassword", () => {
  it("sets the password on the current user", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: {}, error: null } as never);

    const { error } = await setAccountPassword("s3cret-passphrase");

    expect(error).toBeNull();
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "s3cret-passphrase" });
  });

  it("maps a weak password error", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {},
      error: apiError("weak_password"),
    } as never);

    const { error } = await setAccountPassword("123");

    expect(error?.code).toBe("weak_password");
  });
});

describe("readUpgradeRedirectError", () => {
  it("returns null when the URL carries no error", () => {
    expect(readUpgradeRedirectError("https://numa.test/migration")).toBeNull();
  });

  it("detects an expired link in the fragment", () => {
    const error = readUpgradeRedirectError(
      "https://numa.test/migration#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid",
    );

    expect(error?.code).toBe("link_expired");
  });

  it("detects an error code in the query string", () => {
    const error = readUpgradeRedirectError("https://numa.test/migration?error_code=email_exists");

    expect(error?.code).toBe("email_already_used");
  });

  it("falls back to unknown for an error without a known code", () => {
    expect(readUpgradeRedirectError("https://numa.test/migration?error=server_error")?.code).toBe(
      "unknown",
    );
  });
});
