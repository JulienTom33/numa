import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Historique des conversations", () => {
  test("affiche l'état vide depuis l'entrée Mes conversations du profil", async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.locator("#app__tabbar--main-profile").click();
    await page.locator("#profile__row--history").click();

    await expect(page.locator("#history__title--main")).toBeVisible();
    await expect(page.locator("#conversation-list__empty--main")).toBeVisible();
  });

  test("supprime une conversation après confirmation", async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.locator("#app__tabbar--main-consult").click();
    await page.locator("#chat-suggestions__chip--week").click();
    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();

    await page.locator("#app__tabbar--main-profile").click();
    await page.locator("#profile__row--history").click();
    const deleteButton = page.locator('[id^="conversation-list__delete--"]');
    await expect(deleteButton).toHaveCount(1);

    await deleteButton.click();
    await page.locator("#delete-conversation__button--cancel").click();
    await expect(deleteButton).toHaveCount(1);

    await deleteButton.click();
    await page.locator("#delete-conversation__button--confirm").click();

    await expect(page.locator("#conversation-list__empty--main")).toBeVisible();
    await expect(page.locator("#delete-conversation__sheet--main")).toHaveCount(0);
  });
});
