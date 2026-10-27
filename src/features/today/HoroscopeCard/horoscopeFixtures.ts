import type { Horoscope } from "../horoscope/horoscope";

export const sampleHoroscope: Horoscope = {
  date: "2026-10-27",
  sections: {
    general: "La journée peut inviter à la douceur et à prendre un peu de recul.",
    relations: "Le dialogue tend à être plus fluide avec vos proches.",
    work: "Vous pouvez avancer pas à pas sur ce qui est en cours.",
    energy: "Votre énergie peut rester stable jusqu'au soir.",
  },
  basis: {
    confidence: "high",
    aspects: [{ transitBody: "mars", natalPoint: "sun", type: "square", orb: 1.2 }],
    warnings: [],
  },
};

export const incompleteHoroscope: Horoscope = {
  ...sampleHoroscope,
  basis: { confidence: "low", aspects: [], warnings: ["unknown_time"] },
};
