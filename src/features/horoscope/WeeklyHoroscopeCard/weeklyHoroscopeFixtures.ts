import type { WeeklyHoroscope } from "../weeklyHoroscope/weeklyHoroscope";

export const sampleWeeklyHoroscope: WeeklyHoroscope = {
  weekStart: "2026-10-26",
  weekEnd: "2026-11-01",
  sections: {
    general: "La semaine peut inviter à ralentir et à faire le point.",
    relations: "Les échanges tendent à être plus doux en milieu de semaine.",
    work: "Vous pouvez avancer sur les sujets en cours sans vous presser.",
    energy: "Votre énergie peut remonter vers la fin de la semaine.",
  },
  basis: {
    ascendantKnown: true,
    events: [
      { kind: "ingress", body: "venus", detail: "scorpio", at: "2026-10-28T08:00:00Z" },
      { kind: "station", body: "mercury", detail: "retrograde", at: "2026-10-29T10:00:00Z" },
      { kind: "moonPhase", body: "moon", detail: "full_moon", at: "2026-10-30T12:00:00Z" },
      { kind: "eclipse", body: "lunar", detail: "partial", at: "2026-10-31T03:00:00Z" },
    ],
    aspects: [{ bodyA: "mars", bodyB: "saturn", type: "square", orb: 0.8 }],
  },
};

export const fallbackWeeklyHoroscope: WeeklyHoroscope = { ...sampleWeeklyHoroscope, sections: null };

export const calmWeeklyHoroscope: WeeklyHoroscope = {
  ...sampleWeeklyHoroscope,
  sections: null,
  basis: { ascendantKnown: false, events: [], aspects: [] },
};
