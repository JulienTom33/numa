import { expect, test } from "@playwright/test";
import { askQuestions, completeOnboarding } from "../support/discovery";

test.describe("Mode découverte", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test("le badge est visible sur tous les onglets", async ({ page }) => {
    for (const tab of ["today", "consult", "theme", "profile"]) {
      await page.locator(`#app__tabbar--main-${tab}`).click();
      await expect(page.locator("#discovery-mode-badge__badge--main")).toBeVisible();
    }
  });

  test("aucune incitation tant que les deux lectures gratuites sont intactes", async ({ page }) => {
    await page.locator("#app__tabbar--main-consult").click();

    await expect(page.locator("#chat-view__section--main")).toBeVisible();
    await expect(page.locator("#discovery-banner__callout--remaining")).toHaveCount(0);
    await expect(page.locator("#conversion-sheet__dialog--main")).toHaveCount(0);
  });

  test("le bandeau apparaît quand il reste une lecture gratuite", async ({ page }) => {
    await askQuestions(page, 1);
    await page.locator("#app__tabbar--main-consult").click();

    await expect(page.locator("#discovery-banner__callout--remaining")).toBeVisible();
  });

  test("la fiche de conversion apparaît quand les lectures sont épuisées et peut être fermée", async ({ page }) => {
    await askQuestions(page, 2);
    await page.locator("#app__tabbar--main-consult").click();

    await expect(page.locator("#conversion-sheet__dialog--main")).toBeVisible();
    await expect(page.locator("#conversion-sheet__button--sign-up")).toBeVisible();
    await expect(page.locator("#conversion-sheet__button--sign-in")).toBeVisible();

    await page.locator("#conversion-sheet__link--continue").click();
    await expect(page.locator("#conversion-sheet__dialog--main")).toBeHidden();
    await expect(page.locator("#discovery-quota-gate__button--sign-up")).toBeVisible();
  });

  test("la fiche de conversion mène à l'inscription", async ({ page }) => {
    await askQuestions(page, 2);
    await page.locator("#app__tabbar--main-consult").click();
    await page.locator("#conversion-sheet__button--sign-up").click();

    await expect(page.locator("#auth-screen__main--signup")).toBeVisible();
  });
});
