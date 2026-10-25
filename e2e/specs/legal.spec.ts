import { expect, test } from "@playwright/test";

test.describe("Politique de confidentialité", () => {
  test("l'accueil mène à la politique, accessible sans session, puis revient à l'accueil", async ({ page }) => {
    await page.goto("/");

    await page.locator("#welcome__link--privacy").click();

    await expect(page).toHaveURL(/\/confidentialite$/);
    await expect(page.locator("#privacy-policy__title--main")).toBeVisible();
    await expect(page.locator("#privacy-policy__callout--summary")).toBeVisible();
    await expect(page.locator("#privacy-policy__title--deletion")).toBeVisible();
    await expect(page.locator("#privacy-policy__list--providers")).toContainText("Mistral AI");

    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page.locator("#welcome__title--main")).toBeVisible();
  });

  test("l'accès direct à /confidentialite sans session affiche la politique", async ({ page }) => {
    await page.goto("/confidentialite");

    await expect(page.locator("#privacy-policy__main--root")).toBeVisible();
    await expect(page.locator("#welcome__title--main")).toHaveCount(0);
  });
});
