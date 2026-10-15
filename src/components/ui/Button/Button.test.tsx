import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renders its label with the given id and a button type by default", () => {
    render(<Button id="test__button--main">Continuer</Button>);
    const button = screen.getByRole("button", { name: "Continuer" });

    expect(button).toHaveAttribute("id", "test__button--main");
    expect(button).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(
      <Button id="test__button--main" onClick={onClick}>
        Continuer
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button id="test__button--main" onClick={onClick} disabled>
        Continuer
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("is disabled and busy while loading, showing the loading label", () => {
    render(
      <Button id="test__button--main" loading loadingLabel="Envoi…">
        Envoyer
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Envoi…" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("keeps its label while loading when no loading label is given", () => {
    render(
      <Button id="test__button--main" loading>
        Envoyer
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  });

  it.each([
    ["primary", "bg-coral"],
    ["ink", "bg-ink"],
    ["outline", "border-ink"],
    ["soft", "bg-violet-soft"],
    ["danger", "bg-coral-ink"],
  ] as const)("applies the %s variant styles", (variant, expectedClass) => {
    render(
      <Button id="test__button--main" variant={variant}>
        Action
      </Button>,
    );

    expect(screen.getByRole("button")).toHaveClass(expectedClass);
  });

  it("supports the small size and full width", () => {
    render(
      <Button id="test__button--main" fullWidth size="sm">
        Action
      </Button>,
    );

    expect(screen.getByRole("button")).toHaveClass("w-full", "h-9");
  });

  it("renders a leading icon", () => {
    render(
      <Button id="test__button--main" leadingIcon={<span data-testid="icon" />}>
        Google
      </Button>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
