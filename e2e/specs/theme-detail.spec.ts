import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Thème détaillé", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.locator("#app__tabbar--main-theme").click();
  });

  test("en découverte, le thème détaillé complet est visible", async ({ page }) => {
    await expect(page.locator("#my-chart__card--details")).toBeVisible();
    await expect(page.locator("#my-chart__list--planets")).toBeVisible();
    await expect(page.locator("#my-chart__text--details-confidence")).toBeVisible();
    await expect(page.locator("#my-chart__list--aspects")).toBeVisible();
    await expect(page.locator("#my-chart__button--signup")).toHaveCount(0);
    await expect(page.locator("#my-chart__reading--sun__text--why")).toContainText("le Soleil était à");
    await expect(page.locator("#my-chart__reading--ascendant__text--why")).toContainText("se levait à l'horizon");
  });

  test("« Comprendre mon thème » ouvre puis ferme la modale d'explication", async ({ page }) => {
    await page.locator("#my-chart__button--understand").click();

    await expect(page.locator("#my-chart__sheet--understand")).toBeVisible();
    await expect(page.locator("#my-chart__section--understand-limits")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#my-chart__sheet--understand")).toHaveCount(0);
  });
});
