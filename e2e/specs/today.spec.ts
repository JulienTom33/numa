import { expect, test } from "@playwright/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Écran Aujourd'hui", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test("affiche le bonjour personnalisé, l'énergie du jour et les données utilisées", async ({ page }) => {
    await expect(page.locator("#today__title--greeting")).toHaveText("Bonjour Camille");
    await expect(page.locator("#today__text--date")).toBeVisible();
    await expect(page.locator("#today__card--energy")).toBeVisible();
    await expect(page.locator("#today__card--sources")).toBeVisible();
  });

  test("la pastille découverte ouvre l'inscription", async ({ page }) => {
    await page.locator("#today__button--discovery").click();

    await expect(page).toHaveURL(/\/inscription$/);
  });

  test("la carte chat mène à Consulter", async ({ page }) => {
    await page.locator("#today__button--chat").click();

    await expect(page).toHaveURL(/\/consulter$/);
  });

  test("l'avatar mène au profil", async ({ page }) => {
    await page.locator("#today__avatar--profile").click();

    await expect(page).toHaveURL(/\/profil$/);
  });
});
