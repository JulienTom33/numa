import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Thème détaillé", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.locator("#app__tabbar--main-theme").click();
  });

  test("en découverte, le détail est remplacé par l'appel à la connexion", async ({ page }) => {
    await expect(page.locator("#my-chart__card--details")).toHaveCount(0);
    await page.locator("#my-chart__button--signup").click();

    await expect(page).toHaveURL(/\/inscription$/);
  });

  test("« Comprendre mon thème » ouvre puis ferme la modale d'explication", async ({ page }) => {
    await page.locator("#my-chart__button--understand").click();

    await expect(page.locator("#my-chart__sheet--understand")).toBeVisible();
    await expect(page.locator("#my-chart__section--understand-limits")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#my-chart__sheet--understand")).toHaveCount(0);
  });
});
