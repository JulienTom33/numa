import type { TFunction } from "i18next";
import type { QuestionQuotaError, QuestionQuotaErrorCode } from "../../../features/discovery/questionQuota/questionQuota";

export type CommonTranslate = TFunction<"common">;

export interface TranslatedQuestionQuotaError extends QuestionQuotaError {
  message: string;
}

/** Message affiché pour un code d'erreur du quota de questions. */
export function questionQuotaErrorMessage(code: QuestionQuotaErrorCode, t: CommonTranslate): string {
  return t(`questionQuota.errors.${code}`);
}

/** Ajoute à une erreur de quota son message traduit, sans perdre le code. */
export function translateQuestionQuotaError(error: QuestionQuotaError, t: CommonTranslate): TranslatedQuestionQuotaError {
  return { ...error, message: questionQuotaErrorMessage(error.code, t) };
}
