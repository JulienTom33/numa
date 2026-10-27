import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Horoscope, HoroscopeErrorCode } from "../horoscope/horoscope";
import type { LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import HoroscopeCard from "./HoroscopeCard";
import { incompleteHoroscope, sampleHoroscope } from "./horoscopeFixtures";

interface Options {
  status?: LoadStatus;
  data?: Horoscope | null;
  errorCode?: HoroscopeErrorCode | null;
}

function renderCard({ status = "ready", data = sampleHoroscope, errorCode = null }: Options = {}) {
  const onRetry = vi.fn();
  render(<HoroscopeCard status={status} data={data} errorCode={errorCode} onRetry={onRetry} />);
  return onRetry;
}

describe("HoroscopeCard", () => {
  it("affiche les quatre sections de la lecture", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "Général" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Relations" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Travail" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Énergie" })).toBeInTheDocument();
    expect(document.getElementById("horoscope__text--work")).toHaveTextContent("Vous pouvez avancer pas à pas");
  });

  it("explique la lecture dans l'encart « Pourquoi cette lecture ? »", async () => {
    renderCard();
    const toggle = screen.getByRole("button", { name: "Pourquoi cette lecture ?" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("horoscope__item--aspect-mars-sun-square")).toHaveTextContent(
      "Mars en carré avec votre soleil",
    );
    expect(document.getElementById("horoscope__text--why-disclaimer")).toBeInTheDocument();
  });

  it("signale les avertissements du calcul et l'absence d'aspect serré", async () => {
    renderCard({ data: incompleteHoroscope });
    await userEvent.click(screen.getByRole("button", { name: "Pourquoi cette lecture ?" }));

    expect(document.getElementById("horoscope__text--warning-unknown_time")).toBeInTheDocument();
    expect(document.getElementById("horoscope__text--why-calm")).toBeInTheDocument();
    expect(document.getElementById("horoscope__list--why-aspects")).toBeNull();
  });

  it("indique le chargement", () => {
    renderCard({ status: "loading", data: null });

    expect(screen.getByRole("status")).toHaveTextContent("Rédaction");
    expect(document.getElementById("horoscope__list--sections")).toBeNull();
  });

  it("propose de réessayer après une erreur", async () => {
    const onRetry = renderCard({ status: "error", data: null, errorCode: "ai_unavailable" });

    expect(screen.getByRole("alert")).toHaveTextContent("momentanément indisponible");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
