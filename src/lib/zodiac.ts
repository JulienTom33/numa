import i18n from "../i18n";
import type { ZodiacSign } from "../../shared/zodiac/zodiac.ts";

export function getSignLabel(sign: ZodiacSign): string {
  return i18n.t(`astrology:signs.${sign}`);
}
