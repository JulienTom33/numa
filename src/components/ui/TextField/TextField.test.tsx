import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TextField from "./TextField";

describe("TextField", () => {
  it("links the label to the input", () => {
    render(<TextField id="test__input--name" label="Prénom" />);

    expect(screen.getByLabelText("Prénom")).toHaveAttribute("id", "test__input--name");
  });

  it("forwards typed text to onChange", async () => {
    const onChange = vi.fn();
    render(<TextField id="test__input--name" label="Prénom" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Prénom"), "Léa");

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("describes the input with its hint", () => {
    render(<TextField id="test__input--name" label="Prénom" hint="Ou un pseudonyme" />);

    expect(screen.getByLabelText("Prénom")).toHaveAccessibleDescription("Ou un pseudonyme");
  });

  it("marks the input invalid and describes the error", () => {
    render(
      <TextField
        id="test__input--email"
        label="Email"
        hint="Nous vous enverrons un lien"
        error="Adresse email invalide"
      />,
    );
    const input = screen.getByLabelText("Email");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Nous vous enverrons un lien Adresse email invalide");
  });

  it("has no description or invalid state by default", () => {
    render(<TextField id="test__input--name" label="Prénom" />);
    const input = screen.getByLabelText("Prénom");

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("can visually hide its label while keeping it accessible", () => {
    render(<TextField id="test__input--city" label="Ville de naissance" hideLabel />);

    expect(screen.getByText("Ville de naissance")).toHaveClass("sr-only");
    expect(screen.getByLabelText("Ville de naissance")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<TextField id="test__input--name" label="Prénom" disabled />);

    expect(screen.getByLabelText("Prénom")).toBeDisabled();
  });
});
