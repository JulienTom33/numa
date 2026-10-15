import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthScreen, { type AuthMode } from "./AuthScreen";

function setup(mode: AuthMode, overrides: Partial<Parameters<typeof AuthScreen>[0]> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onGoogle: vi.fn(),
    onApple: vi.fn(),
    onEmailLink: vi.fn(),
    onSwitchMode: vi.fn(),
  };
  const view = render(<AuthScreen mode={mode} {...handlers} {...overrides} />);
  return { ...handlers, ...view };
}

describe("AuthScreen", () => {
  it("renders the signup screen with benefits and privacy note", () => {
    const { container } = setup("signup");

    expect(container.querySelector("#auth-screen__main--signup")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Gardez votre thème avec vous",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(container.querySelector("#auth-screen__item--natal-chart")).toBeInTheDocument();
    expect(container.querySelector("#auth-screen__text--privacy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "J'ai déjà un compte" })).toBeInTheDocument();
  });

  it("renders the signin screen without benefits nor privacy note", () => {
    const { container } = setup("signin");

    expect(container.querySelector("#auth-screen__main--signin")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Heureux de vous revoir" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(container.querySelector("#auth-screen__text--privacy")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer un compte" })).toBeInTheDocument();
  });

  it("calls each action from its button", async () => {
    const user = userEvent.setup();
    const { onBack, onGoogle, onApple, onEmailLink, onSwitchMode } = setup("signin");

    await user.click(screen.getByRole("button", { name: "Retour" }));
    await user.click(screen.getByRole("button", { name: "Continuer avec Google" }));
    await user.click(screen.getByRole("button", { name: "Continuer avec Apple" }));
    await user.click(screen.getByRole("button", { name: "Recevoir un lien par email" }));
    await user.click(screen.getByRole("button", { name: "Créer un compte" }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onGoogle).toHaveBeenCalledTimes(1);
    expect(onApple).toHaveBeenCalledTimes(1);
    expect(onEmailLink).toHaveBeenCalledTimes(1);
    expect(onSwitchMode).toHaveBeenCalledTimes(1);
  });

  it("uses the back label provided by the caller", () => {
    setup("signup", { backLabel: "Retour à Aujourd'hui" });

    expect(screen.getByRole("button", { name: "Retour à Aujourd'hui" })).toBeInTheDocument();
  });

  it("blocks other providers while one is pending", () => {
    setup("signup", { pendingProvider: "google" });

    expect(screen.getByRole("button", { name: "Continuer avec Google" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Continuer avec Apple" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Recevoir un lien par email" })).toBeDisabled();
  });

  it("shows the error message as an alert", () => {
    setup("signin", { errorMessage: "La connexion a échoué. Réessayez." });

    expect(screen.getByRole("alert")).toHaveTextContent("La connexion a échoué. Réessayez.");
  });
});
