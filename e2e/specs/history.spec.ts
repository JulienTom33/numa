import { expect, test } from "@playwright/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Historique des conversations", () => {
  test("affiche l'état vide depuis l'entrée Mes conversations du profil", async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.locator("#app__tabbar--main-profile").click();
    await page.locator("#profile__row--history").click();

    await expect(page.locator("#history__title--main")).toBeVisible();
    await expect(page.locator("#conversation-list__empty--main")).toBeVisible();
  });
});
