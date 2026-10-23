import { describe, expect, it } from "vitest";
import { findConventionViolations } from "./checkModuleConvention";

describe("findConventionViolations", () => {
  it("accepte un module dans son dossier avec test et story", () => {
    expect(
      findConventionViolations([
        "src/shared/components/ui/Badge/Badge.tsx",
        "src/shared/components/ui/Badge/Badge.test.tsx",
        "src/shared/components/ui/Badge/Badge.stories.tsx",
      ]),
    ).toEqual([]);
  });

  it("accepte un fichier d'aide dans le dossier d'un module", () => {
    expect(
      findConventionViolations([
        "src/shared/components/ui/Avatar/Avatar.tsx",
        "src/shared/components/ui/Avatar/getInitial.ts",
      ]),
    ).toEqual([]);
  });

  it("refuse un fichier à plat dans un dossier de catégorie", () => {
    const violations = findConventionViolations(["src/lib/cx.ts", "src/lib/cx.test.ts"]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("src/lib/cx.ts");
  });

  it("refuse un test sans module correspondant", () => {
    const violations = findConventionViolations([
      "src/features/discovery/discovery.test.tsx",
      "src/features/discovery/DiscoveryBanner/DiscoveryBanner.tsx",
    ]);
    expect(violations).toEqual([
      "src/features/discovery/discovery.test.tsx : aucun fichier discovery.ts(x) correspondant dans le même dossier",
    ]);
  });

  it("ignore les points d'entrée, la configuration et les fichiers générés", () => {
    expect(
      findConventionViolations([
        "src/main.tsx",
        "src/App.tsx",
        "src/test/setup.ts",
        "src/i18n/i18next.d.ts",
        "src/i18n/locales/fr/index.ts",
        "shared/database.types.ts",
        "src/index.css",
      ]),
    ).toEqual([]);
  });

  it("applique la convention au dossier racine shared", () => {
    expect(findConventionViolations(["shared/zodiac/zodiac.ts"])).toEqual([]);
    expect(findConventionViolations(["shared/zodiac.ts"])).toHaveLength(1);
  });
});
