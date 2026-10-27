import { expect, test } from "@playwright/test";
import { completeOnboarding } from "../support/discovery";

test.describe("Cookies", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("la bannière s'affiche au premier lancement, disparaît après un choix et ne revient pas", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#cookie-banner__section--root")).toBeVisible();
    await page.locator("#cookie-banner__button--accept").click();
    await expect(page.locator("#cookie-banner__section--root")).toHaveCount(0);

    await page.reload();
    await expect(page.locator("#welcome__title--main")).toBeVisible();
    await expect(page.locator("#cookie-banner__section--root")).toHaveCount(0);
  });

  test("refuser mémorise le choix sans interrompre la session, stockée en cookie", async ({ page }) => {
    await completeOnboarding(page);
    await page.locator("#cookie-banner__button--refuse").click();
    await expect(page.locator("#cookie-banner__section--root")).toHaveCount(0);

    await page.reload();

    await expect(page.locator("#app__shell--root")).toBeVisible();
    await expect(page.locator("#cookie-banner__section--root")).toHaveCount(0);

    const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
    expect(cookieNames.some((name) => /^sb-.*-auth-token/.test(name))).toBe(true);
    const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(storageKeys.some((name) => /^sb-.*-auth-token/.test(name))).toBe(false);
  });
});
