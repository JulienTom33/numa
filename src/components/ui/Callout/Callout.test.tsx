import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Callout from "./Callout";

describe("Callout", () => {
  it("renders its title and content", () => {
    render(
      <Callout id="test__callout--info" title="Fuseau horaire détecté">
        Europe/Paris
      </Callout>,
    );

    expect(screen.getByText("Fuseau horaire détecté")).toBeInTheDocument();
    expect(screen.getByText("Europe/Paris")).toBeInTheDocument();
  });

  it("is not announced as an alert outside of the error tone", () => {
    render(
      <Callout id="test__callout--warning" tone="warning">
        Ascendant imprécis
      </Callout>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("is announced as an alert for errors", () => {
    render(
      <Callout id="test__callout--error" tone="error">
        Le calcul a échoué
      </Callout>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Le calcul a échoué");
  });

  it.each([
    ["info", "bg-sky-soft"],
    ["warning", "bg-gold-soft"],
    ["success", "bg-sage-soft"],
    ["error", "bg-coral-soft"],
    ["highlight", "bg-violet-soft"],
  ] as const)("applies the %s tone", (tone, expectedClass) => {
    const { container } = render(
      <Callout id="test__callout--tone" tone={tone}>
        Texte
      </Callout>,
    );

    expect(container.firstChild).toHaveClass(expectedClass);
  });
});
