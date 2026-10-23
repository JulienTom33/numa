import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StepHeader from "./StepHeader";

describe("StepHeader", () => {
  it("announces the step and renders the title as heading", () => {
    render(
      <StepHeader id="test__step--birth-date" step={2} total={5} title="Quand êtes-vous né(e) ?" />,
    );

    expect(screen.getByText("Étape 2 sur 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quand êtes-vous né(e) ?" })).toBeInTheDocument();
  });

  it("fills one progress segment per completed step", () => {
    const { container } = render(
      <StepHeader id="test__step--birth-date" step={2} total={5} title="Titre" />,
    );

    expect(container.querySelectorAll(".bg-coral")).toHaveLength(2);
    expect(container.querySelectorAll(".bg-line")).toHaveLength(3);
  });

  it("renders an optional subtitle", () => {
    render(
      <StepHeader
        id="test__step--name"
        step={1}
        total={5}
        title="Comment devons-nous vous appeler ?"
        subtitle="Un prénom ou un pseudonyme"
      />,
    );

    expect(screen.getByText("Un prénom ou un pseudonyme")).toBeInTheDocument();
  });
});
