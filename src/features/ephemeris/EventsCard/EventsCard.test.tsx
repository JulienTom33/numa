import { render, screen } from "@testing-library/react";
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

  it("indique l'absence d'événement", () => {
    render(<EventsCard events={{ ingresses: [], stations: [], moonPhases: [], eclipses: [] }} />);

    expect(document.getElementById("ephemeris__text--events-none")).toBeInTheDocument();
  });
});
