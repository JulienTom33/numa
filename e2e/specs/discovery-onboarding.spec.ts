import { expect, test } from "../support/test";
import { mockGeocode, PARIS } from "../support/geocode";
import { completeOnboarding, fillOnboarding, startDiscovery } from "../support/discovery";

test.describe("Découvrir sans compte, onboarding et résumé du thème", () => {
  test("parcours complet avec heure exacte", async ({ page }) => {
    await startDiscovery(page);
    await fillOnboarding(page, { firstName: "Camille", birthTime: "exact" });

    await expect(page.locator("#chart-summary__title--main")).toContainText("Camille");
    await expect(page.locator("#chart-summary__trio--placements")).toBeVisible();
    await expect(page.locator("#chart-summary__item--sun")).toBeVisible();
    await expect(page.locator("#chart-summary__item--moon")).toBeVisible();
    await expect(page.locator("#chart-summary__item--ascendant")).toBeVisible();

    await page.locator("#chart-summary__button--discover").click();
    await expect(page.locator("#app__shell--root")).toBeVisible();
    await expect(page.locator("#discovery-mode-badge__badge--main")).toBeVisible();
  });

  test("heure inconnue : l'ascendant n'est pas calculé et la lecture le dit", async ({ page }) => {
    await startDiscovery(page);
    await fillOnboarding(page, { birthTime: "unknown" });

    await expect(page.locator("#chart-summary__section--root")).toBeVisible();
    await expect(page.locator("#chart-summary__callout--notes")).toBeVisible();
  });

  test("le résumé de saisie permet de revenir modifier une étape", async ({ page }) => {
    await startDiscovery(page);
    await page.locator("#name-step__input--name").fill("Camille");
    await page.locator("#name-step__form--main-continue").click();
    await page.locator("#date-step__select--day").selectOption("15");
    await page.locator("#date-step__select--month").selectOption("3");
    await page.locator("#date-step__select--year").selectOption("1990");
    await page.locator("#date-step__form--main-continue").click();

    await expect(page.locator("#time-step__cards--precision")).toBeVisible();
    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page.locator("#date-step__fieldset--birth-date")).toBeVisible();
  });

  test("une ville à arrondissements demande de choisir l'arrondissement", async ({ page }) => {
    await startDiscovery(page);
    await mockGeocode(page, [PARIS]);
    await page.locator("#name-step__input--name").fill("Camille");
    await page.locator("#name-step__form--main-continue").click();
    await page.locator("#date-step__select--day").selectOption("15");
    await page.locator("#date-step__select--month").selectOption("3");
    await page.locator("#date-step__select--year").selectOption("1990");
    await page.locator("#date-step__form--main-continue").click();
    await page.getByRole("radio", { name: /Heure inconnue/ }).check();
    await page.locator("#onboarding-flow__form--time-continue").click();

    await page.locator("#onboarding-flow__place-step--birth-place-city").fill("Paris");
    await page.getByRole("option", { name: /Paris/ }).click();
    await expect(page.locator("#onboarding-flow__place-step--birth-place-selected")).toHaveCount(0);

    await page.locator("#onboarding-flow__place-step--birth-place-arrondissement").selectOption({ label: "15e" });
    await expect(page.locator("#onboarding-flow__place-step--birth-place-selected")).toContainText("Paris 15e");
  });

  test("les années proposées excluent les moins de 15 ans", async ({ page }) => {
    await startDiscovery(page);
    await page.locator("#name-step__input--name").fill("Camille");
    await page.locator("#name-step__form--main-continue").click();

    const latestYear = new Date().getFullYear() - 15;
    const years = page.locator("#date-step__select--year option");
    await expect(years.nth(1)).toHaveText(String(latestYear));
    await expect(page.locator("#date-step__select--year")).not.toContainText(String(latestYear + 1));
  });

  test.fixme("un onboarding terminé n'est pas redemandé après rechargement", async ({ page }) => {
    // L'onboarding n'est reconnu comme terminé que si le brouillon est à l'étape 5, alors que le parcours
    // se termine à l'étape 6 (ascendant) : après rechargement, l'écran « Votre ascendant » revient.
    await completeOnboarding(page);
    await page.reload();

    await expect(page.locator("#app__shell--root")).toBeVisible();
    await expect(page.locator("#name-step__input--name")).toHaveCount(0);
  });
});
