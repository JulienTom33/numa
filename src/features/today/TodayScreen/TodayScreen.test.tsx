import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { approximateTimeChart, completeChart, unknownTimeChart } from "../../chart/MyChart/myChartFixtures";
import type { MyChartData } from "../../chart/skyChart/skyChart";
import type { MyChartStatus } from "../../chart/useMyChart/useMyChart";
import { sampleHoroscope } from "../HoroscopeCard/horoscopeFixtures";
import TodayScreen from "./TodayScreen";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

interface Options {
  status?: MyChartStatus;
  data?: MyChartData | null;
  isAnonymous?: boolean;
}

function renderScreen({ status = "ready", data = completeChart, isAnonymous = false }: Options = {}) {
  const handlers = {
    onRetry: vi.fn(),
    onOpenProfile: vi.fn(),
    onSignUp: vi.fn(),
    onAskQuestion: vi.fn(),
  };
  render(
    <TodayScreen
      status={status}
      data={data}
      errorCode={status === "error" ? "network_error" : null}
      horoscope={{ status: "ready", data: sampleHoroscope, errorCode: null, retry: handlers.onRetry }}
      isAnonymous={isAnonymous}
      today={new Date("2026-10-24T10:00:00Z")}
      {...handlers}
    />,
  );
  return handlers;
}

describe("TodayScreen", () => {
  it("affiche le bonjour, la date, l'énergie et les trois influences", () => {
    renderScreen();

    expect(document.getElementById("today__title--greeting")).toHaveTextContent("Bonjour Camille");
    expect(document.getElementById("today__text--date")).toHaveTextContent("24 octobre 2026");
    expect(document.getElementById("today__text--energy")).toHaveTextContent("Mars en conjonction avec votre ascendant");
    expect(document.getElementById("today__text--influence-relations")).toHaveTextContent("Forte");
    expect(document.getElementById("today__text--influence-work")).toHaveTextContent("Modérée");
    expect(document.getElementById("today__text--sources")).toHaveTextContent("16 octobre 2026");
    expect(document.getElementById("horoscope__text--general")).toHaveTextContent("La journée peut inviter");
    expect(document.getElementById("horoscope__button--why")).toBeInTheDocument();
  });

  it("masque la pastille découverte quand l'utilisateur est connecté", () => {
    renderScreen();

    expect(document.getElementById("today__button--discovery")).toBeNull();
    expect(document.getElementById("today__avatar--profile")).toBeInTheDocument();
  });

  it("propose l'inscription en mode découverte", async () => {
    const { onSignUp } = renderScreen({ isAnonymous: true });

    await userEvent.click(screen.getByRole("button", { name: "Créer un compte" }));

    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it("ouvre le profil et le chat", async () => {
    const { onOpenProfile, onAskQuestion } = renderScreen();

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir mon profil" }));
    await userEvent.click(screen.getByRole("button", { name: "Consulter Sidéra" }));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
    expect(onAskQuestion).toHaveBeenCalledTimes(1);
  });

  it("indique le chargement", () => {
    renderScreen({ status: "loading", data: null });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(document.getElementById("today__card--energy")).toBeNull();
  });

  it("propose de réessayer après une erreur", async () => {
    const { onRetry } = renderScreen({ status: "error", data: null });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("signale les données incomplètes quand le ciel du jour manque", async () => {
    const { onRetry } = renderScreen({ data: approximateTimeChart });

    expect(document.getElementById("today__text--energy-unavailable")).toBeInTheDocument();
    expect(document.getElementById("today__list--influences")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("explique les points natals non utilisés", () => {
    renderScreen({ data: unknownTimeChart });

    expect(document.getElementById("today__text--moon-skipped")).toBeInTheDocument();
    expect(document.getElementById("today__text--ascendant-skipped")).toBeInTheDocument();
  });
});
