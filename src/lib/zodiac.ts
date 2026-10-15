export const ZODIAC_SIGNS = [
  { value: "aries", label: "Bélier" },
  { value: "taurus", label: "Taureau" },
  { value: "gemini", label: "Gémeaux" },
  { value: "cancer", label: "Cancer" },
  { value: "leo", label: "Lion" },
  { value: "virgo", label: "Vierge" },
  { value: "libra", label: "Balance" },
  { value: "scorpio", label: "Scorpion" },
  { value: "sagittarius", label: "Sagittaire" },
  { value: "capricorn", label: "Capricorne" },
  { value: "aquarius", label: "Verseau" },
  { value: "pisces", label: "Poissons" },
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number]["value"];

export function getSignLabel(sign: ZodiacSign): string {
  return ZODIAC_SIGNS.find((entry) => entry.value === sign)?.label ?? sign;
}
