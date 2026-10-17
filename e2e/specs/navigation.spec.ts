import { expect, test } from "@playwright/test";
import { completeOnboarding } from "../support/discovery";

const TABS = ["today", "consult", "theme", "profile"] as const;

test.describe("Navigation entre onglets et Mon thème", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test("l'onglet Aujourd'hui est actif après l'onboarding", async ({ page }) => {
    await expect(page.locator("#app__tabbar--main-today")).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#app__screen--today")).toBeVisible();
  });

  test("chaque onglet affiche son écran et devient l'onglet courant", async ({ page }) => {
    for (const tab of TABS) {
      await page.locator(`#app__tabbar--main-${tab}`).click();
      await expect(page.locator(`#app__tabbar--main-${tab}`)).toHaveAttribute("aria-current", "page");
      await expect(page.locator(`#app__screen--${tab}`)).toBeVisible();
    }
  });

  test("Mon thème affiche le thème natal, la carte du ciel et les transits", async ({ page }) => {
    await page.locator("#app__tabbar--main-theme").click();

    await expect(page.locator("#my-chart__title--main")).toBeVisible();
    await expect(page.locator("#my-chart__trio--placements")).toBeVisible();
    await expect(page.locator("#my-chart__card--ascendant")).toBeVisible();
    await expect(page.getByRole("button", { name: "Afficher la carte du ciel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Transits actuels" })).toBeVisible();
  });
});
