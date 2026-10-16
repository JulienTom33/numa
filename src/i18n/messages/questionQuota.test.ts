import { describe, expect, it } from "vitest";
import i18n from "..";
import type { QuestionQuotaErrorCode } from "../../lib/questionQuota";
import { questionQuotaErrorMessage, translateQuestionQuotaError } from "./questionQuota";

const t = i18n.getFixedT("fr", "common");

describe("questionQuotaErrorMessage", () => {
  it.each<[QuestionQuotaErrorCode, string]>([
    ["question_quota_exceeded", "Vous avez utilisé vos questions gratuites. Créez un compte pour continuer."],
    ["provider_unavailable", "La réponse n'a pas pu être générée. Votre question n'a pas été décomptée."],
    ["invalid_question", "Votre question est vide ou trop longue."],
    ["unauthenticated", "Votre session a expiré. Rechargez la page."],
    ["network_error", "Le service est momentanément indisponible."],
    ["unknown_error", "Une erreur inattendue est survenue."],
  ])("translates %s", (code, expected) => {
    expect(questionQuotaErrorMessage(code, t)).toBe(expected);
  });
});

describe("translateQuestionQuotaError", () => {
  it("keeps the code and adds the message", () => {
    expect(translateQuestionQuotaError({ code: "network_error" }, t)).toEqual({
      code: "network_error",
      message: "Le service est momentanément indisponible.",
    });
  });
});
