import { afterEach, describe, expect, it } from "vitest";
import i18n from ".";
import { fr } from "./locales/fr";
import { namespaces, supportedLanguages } from "./resources";

describe("i18n", () => {
  afterEach(() => {
    i18n.removeResourceBundle("fr", "test");
  });

  it("is initialized synchronously in French with embedded resources", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe("fr");
    expect(supportedLanguages).toEqual(["fr"]);
    expect(namespaces).toEqual(Object.keys(fr));
  });

  it("translates keys of the default namespace and of other namespaces", () => {
    expect(i18n.t("actions.close")).toBe("Fermer");
    expect(i18n.t("welcome:discover.start")).toBe("Découvrir sans compte");
  });

  it("interpolates values without HTML escaping", () => {
    expect(i18n.t("ui:stepHeader.progress", { step: 2, total: 5 })).toBe("Étape 2 sur 5");
  });

  it("applies French plural rules (0 and 1 are singular)", () => {
    i18n.addResourceBundle("fr", "test", {
      questions_one: "{{count}} question restante",
      questions_other: "{{count}} questions restantes",
    });
    // Namespace ajouté dynamiquement : hors du typage strict des ressources.
    const t = i18n.getFixedT("fr", "test" as never) as unknown as (
      key: string,
      options: { count: number },
    ) => string;

    expect(t("questions", { count: 0 })).toBe("0 question restante");
    expect(t("questions", { count: 1 })).toBe("1 question restante");
    expect(t("questions", { count: 2 })).toBe("2 questions restantes");
  });

  it("rejects unknown keys at compile time", () => {
    // @ts-expect-error la clé n'existe pas dans les ressources : le typecheck doit échouer.
    expect(i18n.t("actions.unknown")).toBe("actions.unknown");
    // @ts-expect-error le namespace n'existe pas.
    expect(i18n.t("missing:key")).toBe("key");
  });
});
