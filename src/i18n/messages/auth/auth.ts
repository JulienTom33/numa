import type { TFunction } from "i18next";
import type { UpgradeError, UpgradeErrorCode } from "../../../features/auth/accountUpgrade/accountUpgrade";

export type AuthTranslate = TFunction<"auth">;

export interface TranslatedUpgradeError extends UpgradeError {
  message: string;
}

/** Message affiché pour un code d'erreur de conversion du compte anonyme. */
export function upgradeErrorMessage(code: UpgradeErrorCode, t: AuthTranslate): string {
  return t(`accountUpgrade.errors.${code}`);
}

/** Ajoute à une erreur de conversion son message traduit, sans perdre le code ni `retryable`. */
export function translateUpgradeError(error: UpgradeError, t: AuthTranslate): TranslatedUpgradeError {
  return { ...error, message: upgradeErrorMessage(error.code, t) };
}
