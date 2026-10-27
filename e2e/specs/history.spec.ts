import { expect, test } from "@playwright/test";
import { completeOnboarding } from "../support/discovery";

// Route de l'historique non branchée dans App.tsx (hors périmètre du ticket #31) : à activer avec le câblage.
test.describe("Historique des conversations", () => {
  test.fixme("liste les conversations et ouvre l'une d'elles avec ses messages", async ({ page }) => {
    await completeOnboarding(page, { firstName: "Camille" });
    await page.goto("/history");

    await expect(page.locator("#history__title--main")).toBeVisible();
    await expect(page.locator("#conversation-list__empty--main")).toBeVisible();
  });
});
