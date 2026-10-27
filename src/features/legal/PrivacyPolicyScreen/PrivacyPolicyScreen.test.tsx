import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PrivacyPolicyScreen from "./PrivacyPolicyScreen";

describe("PrivacyPolicyScreen", () => {
  it("renders the title, the summary and the intro", () => {
    render(<PrivacyPolicyScreen onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Politique de confidentialité" })).toHaveAttribute(
      "id",
      "privacy-policy__title--main",
    );
    expect(screen.getByText("L'essentiel")).toBeInTheDocument();
    expect(screen.getByText(/ne sont jamais envoyées au fournisseur d'IA/)).toBeInTheDocument();
  });

  it("documents birth data, retention, account deletion and marketing", () => {
    render(<PrivacyPolicyScreen onBack={vi.fn()} />);

    for (const name of [
      "Vos données de naissance",
      "Conservation",
      "Suppression du compte",
      "Communications marketing",
      "Connexion et compte",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByText(/Sidéra n'envoie aucune communication marketing/)).toBeInTheDocument();
  });

  it("warns about the free question and names the external providers", () => {
    render(<PrivacyPolicyScreen onBack={vi.fn()} />);

    expect(screen.getByText(/transmis tel quel au fournisseur d'IA/)).toBeInTheDocument();
    const list = screen.getByRole("list");
    for (const provider of ["Supabase", "OVH", "Mistral AI", "Groq", "Open-Meteo", "Google et Apple"]) {
      expect(within(list).getByText(new RegExp(`^${provider}`))).toBeInTheDocument();
    }
  });

  it("calls onBack from the back button", async () => {
    const onBack = vi.fn();
    render(<PrivacyPolicyScreen onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
