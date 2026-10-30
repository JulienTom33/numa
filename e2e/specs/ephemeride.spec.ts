import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Écran Éphéméride", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test("Aujourd'hui, Éphéméride, changement de durée puis retour", async ({ page }) => {
    await page.locator("#today__button--ephemeris").click();

    await expect(page).toHaveURL(/\/ephemeride$/);
    await expect(page.locator("#ephemeris__title--main")).toBeVisible();
    await expect(page.locator("#ephemeris__table--positions")).toBeVisible();
    await expect(page.locator("#ephemeris__row--sun")).toBeVisible();
    await expect(page.locator("#ephemeris__text--moon-name")).toBeVisible();
    await expect(page.locator("#ephemeris__card--source")).toContainText("astronomy-engine");

    await page.locator("#ephemeris__control--period-week").click();
    await expect(page.locator("#ephemeris__select--day")).toBeVisible();
    await expect(page.locator("#ephemeris__table--positions")).toBeVisible();

    await page.locator("#ephemeris__control--period-month").click();
    await expect(page.locator("#ephemeris__select--day")).toBeVisible();
    await expect(page.locator("#ephemeris__card--events")).toBeVisible();

    await page.locator("#ephemeris__button--next").click();
    await expect(page.locator("#ephemeris__table--positions")).toBeVisible();
    await page.locator("#ephemeris__button--today").click();
    await expect(page.locator("#ephemeris__table--positions")).toBeVisible();

    await page.locator("#ephemeris__control--period-day").click();
    await expect(page.locator("#ephemeris__select--day")).toHaveCount(0);

    await page.locator("#ephemeris__topbar--main-back").click();
    await expect(page).toHaveURL(/\/aujourdhui$/);
    await expect(page.locator("#today__title--greeting")).toBeVisible();
  });
});
