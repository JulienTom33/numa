import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConversionSheet from "./ConversionSheet";

describe("ConversionSheet", () => {
  it("expose les trois actions et déclenche les callbacks", () => {
    const onSignUp = vi.fn();
    const onSignIn = vi.fn();
    const onContinue = vi.fn();
    render(<ConversionSheet open onSignUp={onSignUp} onSignIn={onSignIn} onContinue={onContinue} />);

    expect(screen.getByRole("dialog", { name: "Gardez votre lecture avec vous" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Créer un compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    fireEvent.click(screen.getByText("Continuer sans compte"));
    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("ne rend rien fermée", () => {
    render(<ConversionSheet open={false} onSignUp={vi.fn()} onSignIn={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
