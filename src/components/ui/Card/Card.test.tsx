import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "./Card";

describe("Card", () => {
  it("renders a bordered white div by default", () => {
    render(<Card id="test__card--main">Contenu</Card>);
    const card = screen.getByText("Contenu");

    expect(card.tagName).toBe("DIV");
    expect(card).toHaveAttribute("id", "test__card--main");
    expect(card).toHaveClass("border-line", "bg-white", "p-4");
  });

  it("renders the requested element", () => {
    render(
      <Card id="test__card--main" as="section">
        Contenu
      </Card>,
    );

    expect(screen.getByText("Contenu").tagName).toBe("SECTION");
  });

  it("applies tone and padding", () => {
    render(
      <Card id="test__card--main" tone="violet" padding="lg">
        Contenu
      </Card>,
    );

    expect(screen.getByText("Contenu")).toHaveClass("bg-violet-soft", "p-5");
  });

  it("can drop its padding", () => {
    render(
      <Card id="test__card--main" padding="none">
        Contenu
      </Card>,
    );

    expect(screen.getByText("Contenu")).not.toHaveClass("p-4");
  });
});
