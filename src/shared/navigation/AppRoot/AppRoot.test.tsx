import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppRoot from "./AppRoot";

vi.mock("../../supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../../features/auth/useAuth/useAuth", () => {
  const auth = { status: "signed_out", session: null, converted: false, acknowledgeConversion: () => undefined };
  return { useAuth: () => auth };
});

vi.mock("../../../features/auth/useAnonymousSession/useAnonymousSession", () => {
  const result = { start: () => undefined, error: null };
  return { useAnonymousSession: () => result };
});

vi.mock("../../../features/onboarding/useOnboardingStatus/useOnboardingStatus", () => {
  const status = { status: "loading" };
  return { useOnboardingStatus: () => status };
});

function clearCookies() {
  document.cookie.split("; ").forEach((part) => {
    const name = part.split("=")[0];
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AppRoot />,
        children: [
          { path: "/confidentialite", element: <p id="test__text--privacy">Politique</p> },
          {
            path: "*",
            element: (
              <main>
                <button id="test__button--content" type="button">
                  Contenu
                </button>
              </main>
            ),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

afterEach(clearCookies);

describe("AppRoot cookie banner", () => {
  it("is reached before the page content with the keyboard", async () => {
    renderAt("/aujourdhui");

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Lire la politique de confidentialité" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Refuser" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Accepter" })).toHaveFocus();
    await userEvent.tab();
    expect(document.getElementById("test__button--content")).toHaveFocus();
  });

  it("is raised above the tab bar on tab screens", () => {
    renderAt("/profil");

    expect(document.getElementById("cookie-banner__section--root")?.className).toContain("bottom-[calc(4rem");
  });

  it("sticks to the bottom without a tab bar", () => {
    renderAt("/");

    expect(document.getElementById("cookie-banner__section--root")?.className).toContain("bottom-0");
  });

  it("links to the privacy policy", async () => {
    renderAt("/");

    await userEvent.click(screen.getByRole("button", { name: "Lire la politique de confidentialité" }));

    await waitFor(() => {
      expect(document.getElementById("test__text--privacy")).toBeInTheDocument();
    });
    expect(document.getElementById("cookie-banner__link--privacy")).not.toBeInTheDocument();
  });

  it("hides the privacy link on the policy page itself", () => {
    renderAt("/confidentialite");

    expect(document.getElementById("cookie-banner__section--root")).toBeInTheDocument();
    expect(document.getElementById("cookie-banner__link--privacy")).not.toBeInTheDocument();
  });
});
