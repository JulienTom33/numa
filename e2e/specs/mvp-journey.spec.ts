import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";
import { mockGeocode } from "../support/geocode";
import { resolveMagicLinkHash, uniqueEmail, waitForEmail } from "../support/mailpit";

test.describe("Parcours MVP complet", () => {
  test("accueil, découverte, thème, horoscope, deux questions, inscription, migration et reconnexion", async ({
    page,
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("baseURL indisponible");
    await completeOnboarding(page);
    await expect(page.locator("#today__title--greeting")).toHaveText("Bonjour Camille");
    await expect(page.locator("#horoscope__card--root")).toBeVisible();
    await expect(page.locator("#discovery-mode-badge__badge--main")).toBeVisible();

    await page.locator("#app__tabbar--main-theme").click();
    await expect(page).toHaveURL(/\/mon-theme$/);

    await page.locator("#app__tabbar--main-consult").click();
    await page.locator("#chat-suggestions__chip--week").click();
    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();
    await page.locator("#chat-view__input--question").fill("Et ma vie amoureuse ?");
    await page.locator("#chat-view__input--question").press("Enter");
    await expect(page.locator("#chat-message-list__message--m4")).toBeVisible();

    await expect(page.locator("#signup-prompt__dialog--main")).toBeVisible();
    await page.locator("#signup-prompt__link--continue").click();
    await expect(page.locator("#chat-view__callout--exhausted")).toBeVisible();
    await expect(page.locator("#chat-view__input--question")).toBeDisabled();

    const email = uniqueEmail("journey");
    await page.locator("#discovery-quota-gate__button--sign-up").click();
    await page.locator("#auth-screen__button--email-link").click();
    await page.locator("#magic-link-request__input--email").fill(email);
    await page.locator("#magic-link-request__button--send").click();
    await expect(page.locator("#migration__title--main")).toBeVisible();
    await page.locator("#migration__button--continue").click();
    await expect(page.locator("#app__shell--root")).toBeVisible();
    await expect(page.locator("#discovery-mode-badge__badge--main")).toHaveCount(0);

    const context = await browser.newContext();
    await context.addCookies([{ name: "sidera-cookie-consent", value: "accepted", url: baseURL }]);
    const returning = await context.newPage();
    await mockGeocode(returning);
    await returning.goto("/");
    await returning.locator("#welcome__button--sign-in").click();
    await returning.locator("#auth-screen__button--email-link").click();
    await returning.locator("#magic-link-request__input--email").fill(email);
    await returning.locator("#magic-link-request__button--send").click();
    await expect(returning.locator("#magic-link-confirmation__main--root")).toBeVisible();

    const hash = await resolveMagicLinkHash(await waitForEmail(email));
    await returning.goto(`/auth/callback${hash}`);
    await expect(returning.locator("#app__shell--root")).toBeVisible();
    await returning.locator("#app__tabbar--main-profile").click();
    await expect(returning.locator("#profile__title--main")).toHaveText("Camille");
    await context.close();
  });
});
