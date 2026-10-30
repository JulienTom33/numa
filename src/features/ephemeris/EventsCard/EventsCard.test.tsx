import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import EventsCard from "./EventsCard";

describe("EventsCard", () => {
  it("liste les événements triés avec date et heure de Paris", () => {
    render(<EventsCard events={sampleEphemeris.events} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Mercure devient rétrograde en Scorpion");
    expect(items[0]).toHaveTextContent("28 octobre 2026 à 09:00 (heure de Paris)");
    expect(items[1]).toHaveTextContent("Pleine lune");
    expect(items[2]).toHaveTextContent("Vénus passe de Balance à Scorpion");
    expect(items[3]).toHaveTextContent("Éclipse lunaire partielle");
    expect(items[3]).toHaveTextContent("31 octobre 2026 à 02:00");
  });

  const moonIngress = (to: "leo" | "virgo" | "libra" | "scorpio", at: string) => ({
    body: "moon" as const,
    from: "cancer" as const,
    to,
    retrograde: false,
    at,
  });

  it("regroupe les passages de la Lune dans un bloc replié quand il y en a plusieurs", async () => {
    render(
      <EventsCard
        events={{
          ...sampleEphemeris.events,
          ingresses: [
            ...sampleEphemeris.events.ingresses,
            moonIngress("leo", "2026-10-28T01:00:00Z"),
            moonIngress("virgo", "2026-10-30T05:00:00Z"),
            moonIngress("libra", "2026-11-01T09:00:00Z"),
          ],
        }}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    const summary = screen.getByRole("button", { name: /Passages de la Lune dans les signes \(3\)/ });
    expect(summary).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(summary);

    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("ephemeris__list--moon-ingresses")?.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText(/environ tous les deux jours et demi/)).toBeInTheDocument();
  });

  it("garde les passages de la Lune dans la liste quand ils sont peu nombreux", () => {
    render(
      <EventsCard
        events={{
          ...sampleEphemeris.events,
          ingresses: [
            ...sampleEphemeris.events.ingresses,
            moonIngress("leo", "2026-10-28T01:00:00Z"),
            moonIngress("virgo", "2026-10-30T05:00:00Z"),
          ],
        }}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.queryByRole("button", { name: /Passages de la Lune/ })).not.toBeInTheDocument();
  });

  it("indique l'absence d'événement", () => {
    render(<EventsCard events={{ ingresses: [], stations: [], moonPhases: [], eclipses: [] }} />);

    expect(document.getElementById("ephemeris__text--events-none")).toBeInTheDocument();
  });
});
