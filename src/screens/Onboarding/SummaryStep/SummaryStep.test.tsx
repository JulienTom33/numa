import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_ONBOARDING_DATA, type OnboardingData } from "../../../lib/birthData";
import SummaryStep from "./SummaryStep";

const DATA: OnboardingData = {
  firstName: "  Émile ",
  birthDate: "1990-03-01",
  birthTime: { precision: "exact", time: "14:30", margin: null },
  birthPlace: { label: "Lyon, France", latitude: 45.76, longitude: 4.83, timezone: "Europe/Paris" },
};

function renderSummary(data: OnboardingData = DATA, extra: Partial<Parameters<typeof SummaryStep>[0]> = {}) {
  const props = { data, onEdit: vi.fn(), onConfirm: vi.fn(), onBack: vi.fn(), ...extra };
  render(<SummaryStep {...props} />);
  return props;
}

function valueOf(slug: string) {
  return document.getElementById(`summary-step__value--${slug}`);
}

describe("SummaryStep", () => {
  it("lists every answer with the place timezone", () => {
    renderSummary();

    expect(screen.getByText("Étape 5 sur 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vérifiez vos informations" })).toBeInTheDocument();
    expect(valueOf("first-name")).toHaveTextContent("Émile");
    expect(valueOf("birth-date")).toHaveTextContent("1 mars 1990");
    expect(valueOf("birth-time")).toHaveTextContent("14:30");
    expect(valueOf("birth-place")).toHaveTextContent("Lyon, France");
    expect(document.getElementById("summary-step__detail--birth-place")).toHaveTextContent(
      "Fuseau horaire : Europe/Paris",
    );
    expect(screen.queryByText(/ascendant/)).not.toBeInTheDocument();
  });

  it("opens the matching step from each edit link", async () => {
    const onEdit = vi.fn();
    renderSummary(DATA, { onEdit });

    await userEvent.click(screen.getByRole("button", { name: "Modifier : Prénom" }));
    await userEvent.click(screen.getByRole("button", { name: "Modifier : Date de naissance" }));
    await userEvent.click(screen.getByRole("button", { name: "Modifier : Heure de naissance" }));
    await userEvent.click(screen.getByRole("button", { name: "Modifier : Lieu de naissance" }));

    expect(onEdit.mock.calls).toEqual([[1], [2], [3], [4]]);
  });

  it("confirms from the validate button", async () => {
    const { onConfirm } = renderSummary();

    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("warns about an approximate time", () => {
    renderSummary({ ...DATA, birthTime: { precision: "approximate", time: "08:45", margin: "over_2_h" } });

    expect(valueOf("birth-time")).toHaveTextContent("Vers 08:45 (marge > 2 h)");
    expect(screen.getByText(/Votre heure est approximative/)).toBeInTheDocument();
  });

  it("warns about an unknown time", () => {
    renderSummary({ ...DATA, birthTime: { precision: "unknown", time: "", margin: null } });

    expect(valueOf("birth-time")).toHaveTextContent("Heure inconnue");
    expect(screen.getByText(/Sans heure de naissance/)).toBeInTheDocument();
  });

  it("marks missing answers", () => {
    renderSummary(EMPTY_ONBOARDING_DATA);

    for (const slug of ["first-name", "birth-date", "birth-time", "birth-place"]) {
      expect(valueOf(slug)).toHaveTextContent("Non renseigné");
    }
    expect(document.getElementById("summary-step__detail--birth-place")).not.toBeInTheDocument();
  });

  it("shows the save error and a busy validate button", () => {
    renderSummary(DATA, { error: "Enregistrement impossible.", saving: true });

    expect(screen.getByRole("alert")).toHaveTextContent("Enregistrement impossible.");
    expect(document.getElementById("summary-step__form--main-continue")).toBeDisabled();
  });
});
