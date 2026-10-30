import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { anonymousProfile, authenticatedProfile } from "../profileData/profileFixtures";
import { completeChart } from "../../chart/MyChart/myChartFixtures";
import ProfileScreen from "./ProfileScreen";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

function renderScreen(overrides: Partial<Parameters<typeof ProfileScreen>[0]> = {}) {
  const onEdit = vi.fn();
  const onOpenHistory = vi.fn();
  render(
    <ProfileScreen
      profile={authenticatedProfile}
      email="camille@example.com"
      sun="pisces"
      ascendant="taurus"
      saved={false}
      onEdit={onEdit}
      onOpenHistory={onOpenHistory}
      {...overrides}
    />,
  );
  return { onEdit, onOpenHistory };
}

describe("ProfileScreen", () => {
  it("affiche prénom, signes, statut et email masqué", () => {
    renderScreen();

    expect(screen.getByRole("heading", { level: 1, name: "Camille" })).toBeInTheDocument();
    expect(document.getElementById("profile__text--placements")).toHaveTextContent("Soleil Poissons · Ascendant Taureau");
    expect(document.getElementById("profile__badge--status")).toHaveTextContent("Compte gratuit");
    expect(document.getElementById("profile__row--email")).toHaveTextContent("c*****e@example.com");
    expect(document.getElementById("profile__row--birth-place")).toHaveTextContent("Lyon, France");
    expect(document.getElementById("profile__row--tone")).toHaveTextContent("Équilibré");
  });

  it("n'ajoute pas de badge de statut pour un compte anonyme, le badge du mode découverte est celui des onglets", () => {
    renderScreen({ profile: anonymousProfile, email: null, sun: null, ascendant: null });

    expect(document.getElementById("profile__badge--status")).toBeNull();
    expect(document.getElementById("profile__row--email")).toHaveTextContent("Aucun email associé");
    expect(document.getElementById("profile__text--placements")).toHaveTextContent("Non disponible");
  });

  it("affiche le succès après enregistrement", () => {
    renderScreen({ saved: true });
    expect(screen.getByRole("status")).toHaveTextContent("Vos modifications sont enregistrées.");
  });

  it("ouvre l'édition", async () => {
    const { onEdit } = renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Modifier mon profil" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("ouvre l'historique des conversations", async () => {
    const { onOpenHistory } = renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Mes conversations" }));
    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it("affiche le thème détaillé quand il est fourni, et pas sinon", () => {
    renderScreen({ chart: completeChart });
    expect(document.getElementById("profile__card--details")).toBeInTheDocument();
  });

  it("n'affiche pas le détail sans thème", () => {
    renderScreen();
    expect(document.getElementById("profile__card--details")).not.toBeInTheDocument();
  });
});
