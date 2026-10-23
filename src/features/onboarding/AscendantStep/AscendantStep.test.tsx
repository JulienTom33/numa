import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ComputedAscendantStatus } from "../../chart/useComputedAscendant/useComputedAscendant";
import { EMPTY_ASCENDANT_CHOICE, type AscendantChoice, type ComputedAscendant } from "../../chart/ascendant/ascendant";
import type { NatalChartErrorCode } from "../../chart/natalChart/natalChart";
import AscendantStep from "./AscendantStep";

interface HarnessProps {
  initial?: AscendantChoice;
  status?: ComputedAscendantStatus;
  computed?: ComputedAscendant | null;
  errorCode?: NatalChartErrorCode | null;
  precise?: boolean;
  onContinue?: () => void;
  onRetry?: () => void;
  onChange?: (choice: AscendantChoice) => void;
}

const SCORPIO: ComputedAscendant = { sign: "scorpio", degreeInSign: 14.6 };

function Harness({
  initial = EMPTY_ASCENDANT_CHOICE,
  status = "ready",
  computed = SCORPIO,
  errorCode = null,
  precise = true,
  onContinue = () => undefined,
  onRetry = () => undefined,
  onChange,
}: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <AscendantStep
      value={value}
      onChange={(choice) => {
        setValue(choice);
        onChange?.(choice);
      }}
      onContinue={onContinue}
      computedStatus={status}
      computed={computed}
      computedErrorCode={errorCode}
      onRetry={onRetry}
      precise={precise}
    />
  );
}

const continueButton = () => screen.getByRole("button", { name: "Voir mon thème" });

describe("AscendantStep", () => {
  it("shows the computed ascendant and enables the button", () => {
    render(<Harness />);

    expect(screen.getByText("Selon nos calculs, votre ascendant est")).toBeInTheDocument();
    expect(screen.getByText("Scorpion à 14°")).toBeInTheDocument();
    expect(continueButton()).toBeEnabled();
  });

  it("keeps the button disabled while the calculation is loading", () => {
    render(<Harness status="loading" computed={null} />);

    expect(screen.getByRole("status")).toHaveTextContent("Calcul de votre ascendant");
    expect(continueButton()).toBeDisabled();
  });

  it("shows the error with a retry action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Harness status="error" computed={null} errorCode="network_error" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Vérifiez votre connexion");
    expect(continueButton()).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("switches to the declared variant from the edit link", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Ce n'est pas exact ? Modifier" }));

    expect(screen.getByRole("group", { name: "Connaissez-vous déjà votre ascendant ?" })).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();
  });

  it("recommends letting Numa compute when the user does not know", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness precise={false} computed={null} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Non" }));

    expect(screen.getByText(/nous recommandons de laisser Numa le calculer/)).toBeInTheDocument();
    expect(continueButton()).toBeEnabled();
    expect(onChange).toHaveBeenLastCalledWith({ source: "computed", declaredSign: null });
  });

  it("requires a sign when the user knows their ascendant", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness precise={false} computed={null} status="ready" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Oui" }));
    expect(continueButton()).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Lion" }));

    expect(continueButton()).toBeEnabled();
    expect(onChange).toHaveBeenLastCalledWith({ source: "declared", declaredSign: "leo" });
  });

  it("accepts a declared sign identical to the calculation without a warning", async () => {
    const user = userEvent.setup();
    render(<Harness precise={false} />);

    await user.click(screen.getByRole("radio", { name: "Oui" }));
    await user.click(screen.getByRole("radio", { name: "Scorpion" }));

    expect(screen.queryByText(/Numa a calculé/)).not.toBeInTheDocument();
    expect(continueButton()).toBeEnabled();
  });

  it("warns on a mismatch and requires an explicit choice of the version to keep", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness precise={false} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Oui" }));
    await user.click(screen.getByRole("radio", { name: "Lion" }));

    expect(screen.getByText(/Numa a calculé Scorpion, alors que vous indiquez Lion/)).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Garder mon ascendant/ }));
    expect(continueButton()).toBeEnabled();
    expect(onChange).toHaveBeenLastCalledWith({ source: "declared", declaredSign: "leo" });

    await user.click(screen.getByRole("radio", { name: /Utiliser le calcul/ }));
    expect(continueButton()).toBeEnabled();
    expect(onChange).toHaveBeenLastCalledWith({ source: "computed", declaredSign: null });
  });

  it("waits for the calculation before validating a declared sign", async () => {
    const user = userEvent.setup();
    render(<Harness precise={false} status="loading" computed={null} />);

    await user.click(screen.getByRole("radio", { name: "Oui" }));
    await user.click(screen.getByRole("radio", { name: "Lion" }));

    expect(continueButton()).toBeDisabled();
  });

  it("does not block a declared sign when the calculation failed", async () => {
    const user = userEvent.setup();
    render(<Harness precise={false} status="error" computed={null} errorCode="internal_error" />);

    await user.click(screen.getByRole("radio", { name: "Oui" }));
    await user.click(screen.getByRole("radio", { name: "Lion" }));

    expect(continueButton()).toBeEnabled();
  });

  it("restores a declared ascendant when resuming and can return to the calculation", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ source: "declared", declaredSign: "leo" }} computed={SCORPIO} />);

    expect(screen.getByRole("radio", { name: "Oui" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Lion" })).toBeChecked();
    expect(continueButton()).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Revenir au calcul de Numa" }));

    expect(screen.getByText("Scorpion à 14°")).toBeInTheDocument();
  });

  it("submits through the continue button", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<Harness onContinue={onContinue} />);

    await user.click(continueButton());

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
