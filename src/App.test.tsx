import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { EMPTY_ONBOARDING_DATA } from "./lib/birthData";
import { loadOnboardingDraft } from "./lib/onboardingStore";
import { supabase } from "./lib/supabaseClient";

vi.mock("./lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInAnonymously: vi.fn(),
    },
  },
}));

vi.mock("./lib/onboardingStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./lib/onboardingStore")>()),
  loadOnboardingDraft: vi.fn(),
}));

function mockAnonymousSession() {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: { id: "user-1", is_anonymous: true } } },
  } as never);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never);
  window.history.replaceState(null, "", "/");
});

beforeEach(() => {
  vi.mocked(loadOnboardingDraft).mockResolvedValue({
    draft: { step: 5, data: EMPTY_ONBOARDING_DATA },
    birthDataId: "bd-1",
    error: null,
  });
});

describe("App", () => {
  it("renders the welcome screen without tab bar when no session is persisted", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Votre thème astral, lu simplement." }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Découvrir sans compte" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navigation principale" })).not.toBeInTheDocument();
  });

  it("opens the sign up flow from the welcome screen and comes back", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(screen.getByRole("heading", { name: "Gardez votre thème avec vous" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retour à l'accueil" }));
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("opens the sign in flow from the welcome screen", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(screen.getByRole("heading", { name: "Heureux de vous revoir" })).toBeInTheDocument();
  });

  it("opens the sign in flow with the error of a failed auth redirect", async () => {
    window.history.replaceState(null, "", "/#error=access_denied&error_code=otp_expired");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Heureux de vous revoir" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Ce lien a expiré ou a déjà été utilisé.");
    await waitFor(() => expect(supabase.auth.getSession).toHaveBeenCalledTimes(2));
  });

  it("shows a generic message when the discovery session cannot start", async () => {
    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "technical detail" },
    } as never);
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Découvrir sans compte" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Session anonyme non créée.");
    expect(screen.queryByText("technical detail")).not.toBeInTheDocument();
  });

  it("shows the discovery mode badge for an anonymous session", async () => {
    mockAnonymousSession();

    render(<App />);

    expect(await screen.findByText("Mode découverte")).toBeInTheDocument();
  });

  it("shows the tab bar with Today active once a session exists", async () => {
    mockAnonymousSession();

    render(<App />);

    expect(await screen.findByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aujourd'hui" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Aujourd'hui" })).toBeInTheDocument();
  });

  it("switches screen and scrolls back to the top when a tab is selected", async () => {
    mockAnonymousSession();
    render(<App />);
    await screen.findByRole("navigation", { name: "Navigation principale" });
    const content = screen.getByRole("main");
    content.scrollTop = 300;

    await userEvent.click(screen.getByRole("button", { name: "Mon thème" }));

    expect(screen.getByRole("heading", { name: "Mon thème" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mon thème" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Aujourd'hui" })).not.toHaveAttribute("aria-current");
    expect(content.scrollTop).toBe(0);
  });

  it("starts the onboarding for a session whose onboarding is not finished", async () => {
    mockAnonymousSession();
    vi.mocked(loadOnboardingDraft).mockResolvedValue({ draft: null, birthDataId: null, error: null });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Comment devons-nous vous appeler ?" })).toBeInTheDocument();
    expect(screen.getByText("Étape 1 sur 5")).toBeInTheDocument();
    expect(screen.getByText("Mode découverte")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navigation principale" })).not.toBeInTheDocument();
  });

  it("resumes the onboarding at the saved step", async () => {
    mockAnonymousSession();
    vi.mocked(loadOnboardingDraft).mockResolvedValue({
      draft: { step: 2, data: { ...EMPTY_ONBOARDING_DATA, firstName: "Émile" } },
      birthDataId: null,
      error: null,
    });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Quand êtes-vous né(e) ?" })).toBeInTheDocument();
  });
});
