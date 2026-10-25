import { expect, test } from "@playwright/test";
import { BORDEAUX, mockGeocode, mockGeocodeUnavailable } from "../support/geocode";

test.describe("Onboarding : recherche de ville indisponible", () => {
  test("une erreur 503 affiche un message de service indisponible puis la recherche reprend", async ({ page }) => {
    await mockGeocodeUnavailable(page);
    await page.goto("/");
    await page.locator("#welcome__link--discover").click();
    await page.locator("#name-step__input--name").fill("Camille");
    await page.locator("#name-step__form--main-continue").click();
    await page.locator("#date-step__select--day").selectOption("15");
    await page.locator("#date-step__select--month").selectOption("3");
    await page.locator("#date-step__select--year").selectOption("1990");
    await page.locator("#date-step__form--main-continue").click();
    await page.getByRole("radio", { name: /Heure inconnue/ }).check();
    await page.locator("#onboarding-flow__form--time-continue").click();

    const city = page.locator("#onboarding-flow__place-step--birth-place-city");
    await city.fill("Bordeaux");

    await expect(city).toHaveAccessibleDescription(/momentanément indisponible/);
    await expect(city).not.toHaveAccessibleDescription(/connexion/);

    await page.unroute("**/functions/v1/geocode");
    await mockGeocode(page);
    await page.locator("#onboarding-flow__place-step--birth-place-retry").click();

    await page.getByRole("option", { name: new RegExp(BORDEAUX.name) }).click();
    await expect(page.locator("#onboarding-flow__place-step--birth-place-selected")).toBeVisible();
  });
});
