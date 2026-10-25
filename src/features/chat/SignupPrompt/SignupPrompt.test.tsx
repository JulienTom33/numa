import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SignupPrompt from "./SignupPrompt";

function setup(open = true) {
  const handlers = { onSignUp: vi.fn(), onSignIn: vi.fn(), onContinue: vi.fn() };
  render(<SignupPrompt open={open} {...handlers} />);
  return handlers;
}

describe("SignupPrompt", () => {
  it("n'affiche rien quand il est fermé", () => {
    setup(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explique les bénéfices du compte", () => {
    setup();

    expect(screen.getByRole("dialog", { name: "Gardez vos lectures avec vous" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("déclenche les trois actions", async () => {
    const { onSignUp, onSignIn, onContinue } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Créer un compte" }));
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await userEvent.click(screen.getByText("Continuer sans compte"));

    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
