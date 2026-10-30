export interface Arrondissement {
  number: number;
  latitude: number;
  longitude: number;
}

const PARIS: Arrondissement[] = [
  { number: 1, latitude: 48.862, longitude: 2.3359 },
  { number: 2, latitude: 48.8677, longitude: 2.3411 },
  { number: 3, latitude: 48.8626, longitude: 2.3593 },
  { number: 4, latitude: 48.8541, longitude: 2.3569 },
  { number: 5, latitude: 48.8454, longitude: 2.3514 },
  { number: 6, latitude: 48.8495, longitude: 2.3307 },
  { number: 7, latitude: 48.8548, longitude: 2.3115 },
  { number: 8, latitude: 48.8732, longitude: 2.3111 },
  { number: 9, latitude: 48.8771, longitude: 2.3379 },
  { number: 10, latitude: 48.876, longitude: 2.3624 },
  { number: 11, latitude: 48.8601, longitude: 2.3816 },
  { number: 12, latitude: 48.8342, longitude: 2.4173 },
  { number: 13, latitude: 48.8303, longitude: 2.3656 },
  { number: 14, latitude: 48.8297, longitude: 2.323 },
  { number: 15, latitude: 48.8417, longitude: 2.2937 },
  { number: 16, latitude: 48.8572, longitude: 2.263 },
  { number: 17, latitude: 48.8874, longitude: 2.305 },
  { number: 18, latitude: 48.8919, longitude: 2.3487 },
  { number: 19, latitude: 48.8871, longitude: 2.3878 },
  { number: 20, latitude: 48.8625, longitude: 2.3966 },
];

const LYON: Arrondissement[] = [
  { number: 1, latitude: 45.7701, longitude: 4.8264 },
  { number: 2, latitude: 45.7464, longitude: 4.8265 },
  { number: 3, latitude: 45.7514, longitude: 4.8685 },
  { number: 4, latitude: 45.7805, longitude: 4.826 },
  { number: 5, latitude: 45.756, longitude: 4.8012 },
  { number: 6, latitude: 45.7753, longitude: 4.8548 },
  { number: 7, latitude: 45.7321, longitude: 4.8393 },
  { number: 8, latitude: 45.7342, longitude: 4.8695 },
  { number: 9, latitude: 45.7836, longitude: 4.8128 },
];

const MARSEILLE: Arrondissement[] = [
  { number: 1, latitude: 43.3002, longitude: 5.3828 },
  { number: 2, latitude: 43.3225, longitude: 5.3497 },
  { number: 3, latitude: 43.3113, longitude: 5.3806 },
  { number: 4, latitude: 43.3063, longitude: 5.4002 },
  { number: 5, latitude: 43.2925, longitude: 5.4006 },
  { number: 6, latitude: 43.2876, longitude: 5.3814 },
  { number: 7, latitude: 43.2796, longitude: 5.3274 },
  { number: 8, latitude: 43.215, longitude: 5.3256 },
  { number: 9, latitude: 43.2366, longitude: 5.4523 },
  { number: 10, latitude: 43.2743, longitude: 5.4243 },
  { number: 11, latitude: 43.2877, longitude: 5.4787 },
  { number: 12, latitude: 43.3071, longitude: 5.4418 },
  { number: 13, latitude: 43.3528, longitude: 5.4301 },
  { number: 14, latitude: 43.3468, longitude: 5.3915 },
  { number: 15, latitude: 43.3531, longitude: 5.3653 },
  { number: 16, latitude: 43.3642, longitude: 5.3161 },
];

const ARRONDISSEMENTS_BY_PLACE_ID: Record<string, Arrondissement[]> = {
  "2988507": PARIS,
  "2996944": LYON,
  "2995469": MARSEILLE,
};

export function arrondissementsFor(placeId: string): Arrondissement[] | null {
  return ARRONDISSEMENTS_BY_PLACE_ID[placeId] ?? null;
}
