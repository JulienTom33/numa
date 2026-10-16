import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthStatus, UseAuthResult } from "../../hooks/useAuth";
import type { AuthFlowError } from "../../lib/auth";
import type { AuthMode } from "../../screens/Auth/AuthScreen";
import AuthFlow from "./AuthFlow";

function createAuth(overrides: Partial<UseAuthResult> = {}): UseAuthResult {
  return {
    status: "signed_out",
    session: null,
    redirectError: null,
    converted: false,
    sendMagicLink: vi.fn().mockResolvedValue(null),
    resendMagicLink: vi.fn().mockResolvedValue(null),
    signInWithProvider: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(null),
    acknowledgeConversion: vi.fn(),
    dismissRedirectError: vi.fn(),
    ...overrides,
  };
}

function renderFlow(mode: AuthMode, auth: UseAuthResult = createAuth()) {
  const onExit = vi.fn();
  const utils = render(<AuthFlow initialMode={mode} auth={auth} onExit={onExit} />);
  return { ...utils, auth, onExit };
}

const rateLimited: AuthFlowError = { code: "rate_limited", retryable: true };

async function sendEmail(email: string, user = userEvent.setup()) {
  await user.click(screen.getByRole("button", { name: "Recevoir un lien par email" }));
  await user.type(screen.getByLabelText("Adresse email"), email);
  await user.click(screen.getByRole("button", { name: "Envoyer le lien" }));
}

describe("AuthFlow", () => {
  it("opens on the requested mode and switches between sign up and sign in", async () => {
    renderFlow("signup");

    expect(screen.getByRole("heading", { name: "Gardez votre thème avec vous" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "J'ai déjà un compte" }));

    expect(screen.getByRole("heading", { name: "Heureux de vous revoir" })).toBeInTheDocument();
  });

  it("goes back to the welcome screen for a signed out visitor", async () => {
    const { onExit } = renderFlow("signin");

    await userEvent.click(screen.getByRole("button", { name: "Retour à l'accueil" }));

    expect(onExit).toHaveBeenCalledWith("welcome");
  });

  it("goes back to Today in discovery mode", async () => {
    const { onExit } = renderFlow("signup", createAuth({ status: "anonymous" }));

    await userEvent.click(screen.getByRole("button", { name: "Retour à Aujourd'hui" }));

    expect(onExit).toHaveBeenCalledWith("today");
  });

  it("warns an anonymous user that signing in does not keep the discovery data", async () => {
    renderFlow("signin", createAuth({ status: "anonymous" }));

    expect(screen.getByText(/ne lui seront pas rattachées/).closest("#auth-screen__callout--notice")).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Créer un compte" }));

    expect(screen.queryByText(/ne lui seront pas rattachées/)).not.toBeInTheDocument();
  });

  it("does not warn a signed out visitor", () => {
    renderFlow("signin");

    expect(screen.queryByText(/ne lui seront pas rattachées/)).not.toBeInTheDocument();
  });

  it("starts the OAuth flow with the current mode and keeps the button loading", async () => {
    const { auth } = renderFlow("signup");

    await userEvent.click(screen.getByRole("button", { name: "Continuer avec Google" }));

    expect(auth.signInWithProvider).toHaveBeenCalledWith("google", "signup");
    expect(screen.getByRole("button", { name: "Continuer avec Apple" })).toBeDisabled();
  });

  it("shows a translated error when the OAuth flow cannot start", async () => {
    const auth = createAuth({
      signInWithProvider: vi.fn().mockResolvedValue({ code: "provider_unavailable", retryable: false }),
    });
    renderFlow("signin", auth);

    await userEvent.click(screen.getByRole("button", { name: "Continuer avec Apple" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ce moyen de connexion n'est pas disponible pour le moment.",
    );
    expect(screen.getByRole("button", { name: "Continuer avec Google" })).toBeEnabled();
  });

  it("shows the redirect error and dismisses it on the next action", async () => {
    const auth = createAuth({ redirectError: { code: "link_expired", retryable: false } });
    renderFlow("signin", auth);

    expect(screen.getByRole("alert")).toHaveTextContent("Ce lien a expiré ou a déjà été utilisé.");

    await userEvent.click(screen.getByRole("button", { name: "Créer un compte" }));

    expect(auth.dismissRedirectError).toHaveBeenCalled();
  });

  it("sends the magic link with the current mode and shows the confirmation", async () => {
    const { auth } = renderFlow("signup");

    await sendEmail("luna@example.com");

    expect(auth.sendMagicLink).toHaveBeenCalledWith("luna@example.com", "signup");
    expect(await screen.findByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeInTheDocument();
  });

  it("shows the translated send error and stays on the email step", async () => {
    const auth = createAuth({ sendMagicLink: vi.fn().mockResolvedValue(rateLimited) });
    renderFlow("signin", auth);

    await sendEmail("luna@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent("Trop de tentatives.");
    expect(screen.getByRole("heading", { name: "Connexion par lien magique" })).toBeInTheDocument();
  });

  it("resends the link with the current mode and reports a failure", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const auth = createAuth({ resendMagicLink: vi.fn().mockResolvedValue(rateLimited) });
    renderFlow("signup", auth);
    await sendEmail("luna@example.com", user);
    await screen.findByRole("heading", { name: "Vérifiez votre boîte mail" });

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    await user.click(screen.getByRole("button", { name: "Renvoyer le lien" }));

    expect(auth.resendMagicLink).toHaveBeenCalledWith("luna@example.com", "signup");
    expect(await screen.findByText(/Le renvoi du lien a échoué/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("returns from the email step to the providers", async () => {
    renderFlow("signin");
    await userEvent.click(screen.getByRole("button", { name: "Recevoir un lien par email" }));

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));

    expect(screen.getByRole("heading", { name: "Heureux de vous revoir" })).toBeInTheDocument();
  });

  it("opens the space from the confirmation", async () => {
    const { onExit } = renderFlow("signin");
    await sendEmail("luna@example.com");

    await userEvent.click(await screen.findByRole("button", { name: "Accéder à mon espace" }));

    expect(onExit).toHaveBeenCalledWith("today");
  });

  it("leaves to Today as soon as the user is authenticated", () => {
    const status: AuthStatus = "authenticated";
    const { onExit } = renderFlow("signup", createAuth({ status }));

    expect(onExit).toHaveBeenCalledWith("today");
  });
});
