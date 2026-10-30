import type { MonthlyHoroscope } from "../monthlyHoroscope/monthlyHoroscope";

export const sampleMonthlyHoroscope: MonthlyHoroscope = {
  monthStart: "2026-10-01",
  monthEnd: "2026-10-31",
  sections: {
    general: "Le mois peut inviter à ralentir et à faire le point.",
    relations: "Les échanges tendent à être plus doux en milieu de mois.",
    work: "Vous pouvez avancer sur les sujets en cours sans vous presser.",
    energy: "Votre énergie peut remonter vers la fin du mois.",
  },
  basis: {
    ascendantKnown: true,
    events: [
      { kind: "moonPhase", body: "moon", detail: "new_moon", at: "2026-10-10T08:00:00Z" },
      { kind: "ingress", body: "venus", detail: "scorpio", at: "2026-10-18T08:00:00Z" },
      { kind: "station", body: "mercury", detail: "retrograde", at: "2026-10-24T10:00:00Z" },
      { kind: "moonPhase", body: "moon", detail: "full_moon", at: "2026-10-26T12:00:00Z" },
      { kind: "eclipse", body: "lunar", detail: "partial", at: "2026-10-28T03:00:00Z" },
    ],
    aspects: [{ bodyA: "jupiter", bodyB: "saturn", type: "square", orb: 0.8 }],
  },
};

export const fallbackMonthlyHoroscope: MonthlyHoroscope = { ...sampleMonthlyHoroscope, sections: null };

export const calmMonthlyHoroscope: MonthlyHoroscope = {
  ...sampleMonthlyHoroscope,
  sections: null,
  basis: { ascendantKnown: false, events: [], aspects: [] },
};
