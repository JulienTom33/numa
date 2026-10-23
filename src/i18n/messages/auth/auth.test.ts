import { describe, expect, it, vi } from "vitest";
import i18n from "../../i18n";
import { toUpgradeError, type UpgradeErrorCode } from "../../../features/auth/accountUpgrade/accountUpgrade";
import { translateUpgradeError, upgradeErrorMessage } from "./auth";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

const t = i18n.getFixedT("fr", "auth");

describe("upgradeErrorMessage", () => {
  it.each<[UpgradeErrorCode, string]>([
    ["no_session", "Votre session a expiré. Rechargez la page pour retrouver votre espace."],
    ["not_anonymous", "Votre compte est déjà créé."],
    [
      "email_already_used",
      "Cette adresse est déjà associée à un compte. Connectez-vous avec ce compte ou utilisez une autre adresse.",
    ],
    ["identity_already_linked", "Ce compte est déjà associé à un autre utilisateur."],
    ["invalid_email", "Cette adresse email n'est pas valide."],
    ["weak_password", "Ce mot de passe est trop faible."],
    ["link_expired", "Le lien de confirmation a expiré ou a déjà été utilisé. Demandez-en un nouveau."],
    ["rate_limited", "Trop de tentatives. Patientez quelques minutes avant de réessayer."],
    ["manual_linking_disabled", "La connexion par ce fournisseur n'est pas disponible pour le moment."],
    ["network", "Connexion impossible. Vérifiez votre réseau puis réessayez."],
    ["unknown", "La création du compte a échoué. Réessayez."],
  ])("translates %s", (code, expected) => {
    expect(upgradeErrorMessage(code, t)).toBe(expected);
  });
});

describe("translateUpgradeError", () => {
  it("keeps the code and retryable flag and adds the message", () => {
    expect(translateUpgradeError(toUpgradeError("rate_limited"), t)).toEqual({
      code: "rate_limited",
      retryable: true,
      message: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
    });
  });
});
