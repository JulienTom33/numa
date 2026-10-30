import { describe, expect, it } from "vitest";
import { buildEvents } from "./ephemerisEvents";

describe("buildEvents", () => {
  it("fusionne les quatre familles d'événements triées par date", () => {
    const items = buildEvents({
      events: {
        ingresses: [{ body: "venus", from: "libra", to: "scorpio", retrograde: false, at: "2026-10-30T10:00:00Z" }],
        stations: [{ body: "mercury", type: "retrograde", sign: "scorpio", longitude: 220, at: "2026-10-28T08:00:00Z" }],
        moonPhases: [{ phase: "full_moon", at: "2026-10-29T12:00:00Z" }],
        eclipses: [{ body: "lunar", kind: "partial", at: "2026-10-31T01:00:00Z" }],
      },
    });

    expect(items.map((item) => item.kind)).toEqual(["station", "moonPhase", "ingress", "eclipse"]);
    expect(items[2]).toMatchObject({ body: "venus", to: "scorpio", from: "libra" });
    expect(items[3]).toMatchObject({ body: "lunar", eclipseKind: "partial" });
  });

  it("renvoie une liste vide sans événement", () => {
    expect(buildEvents({ events: { ingresses: [], stations: [], moonPhases: [], eclipses: [] } })).toEqual([]);
  });
});
