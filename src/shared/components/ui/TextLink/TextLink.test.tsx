import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TextLink from "./TextLink";

describe("TextLink", () => {
  it("renders an anchor when href is provided", () => {
    render(
      <TextLink id="test__link--signup" href="/inscription">
        Créer un compte
      </TextLink>,
    );

    expect(screen.getByRole("link", { name: "Créer un compte" })).toHaveAttribute(
      "href",
      "/inscription",
    );
  });

  it("renders a button calling onClick when no href is provided", async () => {
    const onClick = vi.fn();
    render(
      <TextLink id="test__link--discover" onClick={onClick}>
        Découvrir sans compte
      </TextLink>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Découvrir sans compte" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the requested tone", () => {
    render(
      <TextLink id="test__link--edit" tone="coral" onClick={vi.fn()}>
        Modifier
      </TextLink>,
    );

    expect(screen.getByRole("button")).toHaveClass("text-coral-ink");
  });
});
