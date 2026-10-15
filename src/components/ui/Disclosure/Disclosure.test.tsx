import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Disclosure from "./Disclosure";

describe("Disclosure", () => {
  it("hides its content by default", () => {
    render(
      <Disclosure id="test__disclosure--why" summary="Pourquoi cette lecture ?">
        Transits utilisés
      </Disclosure>,
    );

    expect(screen.getByRole("button", { name: "Pourquoi cette lecture ?" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("toggles its content on click", async () => {
    render(
      <Disclosure id="test__disclosure--why" summary="Pourquoi cette lecture ?">
        Transits utilisés
      </Disclosure>,
    );
    const trigger = screen.getByRole("button");

    await userEvent.click(trigger);
    expect(screen.getByRole("region", { name: "Pourquoi cette lecture ?" })).toHaveTextContent(
      "Transits utilisés",
    );

    await userEvent.click(trigger);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("can start open", () => {
    render(
      <Disclosure id="test__disclosure--where" summary="Où trouver cette information ?" defaultOpen>
        Sur votre acte de naissance
      </Disclosure>,
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region")).toBeVisible();
  });

  it("toggles with the keyboard", async () => {
    render(
      <Disclosure id="test__disclosure--why" summary="Pourquoi cette lecture ?">
        Transits utilisés
      </Disclosure>,
    );

    screen.getByRole("button").focus();
    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("region")).toBeVisible();
  });
});
