import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import type { WeeklyErrorCode, WeeklyHoroscope } from "../weeklyHoroscope/weeklyHoroscope";
import WeeklyHoroscopeCard from "./WeeklyHoroscopeCard";
import { calmWeeklyHoroscope, fallbackWeeklyHoroscope, sampleWeeklyHoroscope } from "./weeklyHoroscopeFixtures";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

interface Options {
  status?: LoadStatus;
  data?: WeeklyHoroscope | null;
  errorCode?: WeeklyErrorCode | null;
}

function renderCard({ status = "ready", data = sampleWeeklyHoroscope, errorCode = null }: Options = {}) {
  const onRetry = vi.fn();
  const onOpenProfile = vi.fn();
  render(
    <WeeklyHoroscopeCard
      status={status}
      data={data}
      errorCode={errorCode}
      onRetry={onRetry}
      onOpenProfile={onOpenProfile}
    />,
  );
  return { onRetry, onOpenProfile };
}

describe("WeeklyHoroscopeCard", () => {
  it("affiche la période et les quatre sections", () => {
    renderCard();

    expect(document.getElementById("weekly-horoscope__text--range")).toHaveTextContent("Du 26 octobre 2026 au 1 novembre 2026");
    expect(document.getElementById("weekly-horoscope__text--work")).toHaveTextContent("sans vous presser");
    expect(screen.getByRole("heading", { name: "Énergie" })).toBeInTheDocument();
    expect(document.getElementById("weekly-horoscope__section--fallback")).toBeNull();
  });

  it("détaille les repères calculés dans « Pourquoi cette lecture ? »", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Pourquoi cette lecture ?" }));

    expect(document.getElementById("weekly-horoscope__item--event-ingress-venus-2026-10-28T08:00:00Z")).toHaveTextContent(
      "Vénus entre en Scorpion",
    );
    expect(document.getElementById("weekly-horoscope__item--event-station-mercury-2026-10-29T10:00:00Z")).toHaveTextContent(
      "Mercure devient rétrograde",
    );
    expect(document.getElementById("weekly-horoscope__item--event-moonPhase-moon-2026-10-30T12:00:00Z")).toHaveTextContent(
      "Pleine Lune",
    );
    expect(document.getElementById("weekly-horoscope__item--event-eclipse-lunar-2026-10-31T03:00:00Z")).toHaveTextContent(
      "Éclipse de Lune partielle",
    );
    expect(document.getElementById("weekly-horoscope__item--aspect-mars-saturn-square")).toHaveTextContent(
      "Mars en carré avec saturne (écart de 0.8°)",
    );
    expect(document.getElementById("weekly-horoscope__text--why-disclaimer")).toBeInTheDocument();
  });

  it("affiche le fondement calculé quand la rédaction est indisponible", () => {
    renderCard({ data: fallbackWeeklyHoroscope });

    expect(document.getElementById("weekly-horoscope__text--fallback")).toBeInTheDocument();
    expect(document.getElementById("weekly-horoscope__list--sections")).toBeNull();
    expect(document.getElementById("weekly-horoscope__list--events")).toBeInTheDocument();
    expect(document.getElementById("weekly-horoscope__list--aspects")).toBeInTheDocument();
    expect(document.getElementById("weekly-horoscope__text--basis-disclaimer")).toBeInTheDocument();
  });

  it("signale une semaine calme et l'ascendant inutilisé sans rédaction", () => {
    renderCard({ data: calmWeeklyHoroscope });

    expect(document.getElementById("weekly-horoscope__text--empty")).toBeInTheDocument();
    expect(document.getElementById("weekly-horoscope__text--ascendant-unknown")).toBeInTheDocument();
    expect(document.getElementById("weekly-horoscope__list--events")).toBeNull();
  });

  it("indique le chargement", () => {
    renderCard({ status: "loading", data: null });

    expect(screen.getByRole("status")).toHaveTextContent("Rédaction");
  });

  it("propose de réessayer après une erreur réseau", async () => {
    const { onRetry } = renderCard({ status: "error", data: null, errorCode: "network_error" });

    expect(screen.getByRole("alert")).toHaveTextContent("n'a pas pu être chargé");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("ne propose pas de réessayer sans session", () => {
    renderCard({ status: "error", data: null, errorCode: "unauthenticated" });

    expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  });

  it("propose de renseigner les données de naissance", async () => {
    const { onOpenProfile } = renderCard({ status: "error", data: null, errorCode: "birth_data_not_found" });

    await userEvent.click(screen.getByRole("button", { name: "Renseigner mes données" }));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });
});
