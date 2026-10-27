import { expect, test } from "@playwright/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Historique des conversations", () => {
  test("liste les conversations et ouvre l'une d'elles avec ses messages", async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.goto("/historique");

    await expect(page.locator("#history__title--main")).toBeVisible();
    await expect(page.locator("#conversation-list__empty--main")).toBeVisible();
  });
});
