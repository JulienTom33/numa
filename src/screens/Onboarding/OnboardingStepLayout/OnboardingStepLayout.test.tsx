import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import OnboardingStepLayout from "./OnboardingStepLayout";

function renderLayout(overrides: Partial<Parameters<typeof OnboardingStepLayout>[0]> = {}) {
  const props = {
    id: "test__form--step",
    step: 2,
    totalSteps: 5,
    title: "Quand êtes-vous né(e) ?",
    onBack: vi.fn(),
    onContinue: vi.fn(),
    canContinue: true,
    children: <input id="test__input--field" aria-label="Champ" />,
    ...overrides,
  };
  render(<OnboardingStepLayout {...props} />);
  return props;
}

describe("OnboardingStepLayout", () => {
  it("renders the step counter, title and content", () => {
    renderLayout();

    expect(screen.getByText("Étape 2 sur 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quand êtes-vous né(e) ?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Champ")).toBeInTheDocument();
    expect(document.getElementById("test__form--step-continue")).toHaveTextContent("Continuer");
  });

  it("calls onBack from the back button", async () => {
    const { onBack } = renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onContinue from the button and on Enter", async () => {
    const { onContinue } = renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await userEvent.type(screen.getByLabelText("Champ"), "{Enter}");

    expect(onContinue).toHaveBeenCalledTimes(2);
  });

  it("disables Continue and ignores Enter when the step is incomplete", async () => {
    const { onContinue } = renderLayout({ canContinue: false });

    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Champ"), "{Enter}");

    expect(onContinue).not.toHaveBeenCalled();
  });

  it("shows the discovery badge only in discovery mode", () => {
    renderLayout({ discoveryMode: true, continueLabel: "Voir mon thème" });

    expect(screen.getByText("Mode découverte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voir mon thème" })).toBeInTheDocument();
  });

  it("hides the discovery badge by default", () => {
    renderLayout();

    expect(screen.queryByText("Mode découverte")).not.toBeInTheDocument();
  });
});
