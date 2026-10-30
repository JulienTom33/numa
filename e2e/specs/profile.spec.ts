import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Profil", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.locator("#app__tabbar--main-profile").click();
  });

  test("affiche le prénom, le statut découverte et les données de naissance", async ({ page }) => {
    await expect(page.locator("#profile__title--main")).toHaveText("Camille");
    await expect(page.locator("#profile__badge--status")).toHaveCount(0);
    await expect(page.locator("#discovery-mode-badge__badge--main")).toHaveCount(1);
    await expect(page.locator("#profile__row--birth-place")).toContainText("Bordeaux");
    await expect(page.locator("#profile__row--tone")).toContainText("Équilibré");
  });

  test("l'entrée Mes conversations ouvre l'historique", async ({ page }) => {
    await page.locator("#profile__row--history").click();

    await expect(page).toHaveURL(/\/historique$/);
    await expect(page.locator("#history__title--main")).toBeVisible();
  });

  test("modifier le prénom et le ton est confirmé et persiste après rechargement", async ({ page }) => {
    await page.locator("#profile__button--edit").click();
    await page.locator("#profile-edit__input--first-name").fill("Léa");
    await page.locator("#profile-edit__segmented--tone-direct").click();
    await expect(page.locator("#profile-edit__callout--birth-warning")).toHaveCount(0);
    await page.locator("#profile-edit__button--save").click();

    await expect(page.locator("#profile__callout--saved")).toBeVisible();
    await expect(page.locator("#profile__title--main")).toHaveText("Léa");

    await page.reload();
    await expect(page.locator("#profile__title--main")).toHaveText("Léa");
    await expect(page.locator("#profile__row--tone")).toContainText("Direct");
  });

  test("changer la date de naissance affiche l'avertissement de recalcul", async ({ page }) => {
    await page.locator("#profile__button--edit").click();
    await page.locator("#profile-edit__fieldset--birth-date-year").selectOption("1985");

    await expect(page.locator("#profile-edit__callout--birth-warning")).toBeVisible();
    await page.locator("#profile-edit__button--save").click();
    await expect(page.locator("#profile-edit__confirm--birth")).toBeVisible();
    await page.locator("#profile-edit__button--confirm").click();
    await expect(page.locator("#profile__row--birth-date")).toContainText("1985");
  });

  test("un prénom vide est refusé avec un message", async ({ page }) => {
    await page.locator("#profile__button--edit").click();
    await page.locator("#profile-edit__input--first-name").fill("");
    await page.locator("#profile-edit__button--save").click();

    await expect(page.locator("#profile-edit__input--first-name-error")).toBeVisible();
    await expect(page.locator("#profile__callout--saved")).toHaveCount(0);
  });

  test("supprimer le compte exige une confirmation explicite puis termine la session", async ({ page }) => {
    await page.locator("#profile__button--delete-account").click();
    await expect(page.locator("#delete-account__text--scope")).toBeVisible();
    await expect(page.locator("#delete-account__button--confirm")).toBeDisabled();

    await page.locator("#delete-account__input--keyword").fill("supprimer");
    await page.locator("#delete-account__button--confirm").click();

    await expect(page.locator("#welcome__link--discover")).toBeVisible();
    await page.reload();
    await expect(page.locator("#welcome__link--discover")).toBeVisible();
  });

  test("annuler la suppression du compte conserve le profil", async ({ page }) => {
    await page.locator("#profile__button--delete-account").click();
    await page.locator("#delete-account__button--cancel").click();

    await expect(page.locator("#delete-account__sheet--main")).toHaveCount(0);
    await expect(page.locator("#profile__title--main")).toHaveText("Camille");
  });

  test("annuler ramène à la lecture sans modifier", async ({ page }) => {
    await page.locator("#profile__button--edit").click();
    await page.locator("#profile-edit__input--first-name").fill("Autre");
    await page.locator("#profile-edit__button--cancel").click();

    await expect(page.locator("#profile__title--main")).toHaveText("Camille");
  });
});
