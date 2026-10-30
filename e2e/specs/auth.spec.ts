import { expect, test } from "../support/test";
import { askQuestions, completeOnboarding } from "../support/discovery";
import { uniqueEmail, waitForEmail } from "../support/mailpit";

test.describe("Inscription, connexion et lien magique", () => {
  test("l'accueil mène à l'écran d'inscription puis de connexion", async ({ page }) => {
    await page.goto("/");

    await page.locator("#welcome__button--sign-up").click();
    await expect(page.locator("#auth-screen__main--signup")).toBeVisible();
    await expect(page).toHaveURL(/\/inscription$/);
    await expect(page.locator("#auth-screen__list--benefits")).toBeVisible();

    await page.locator("#auth-screen__link--switch-mode").click();
    await expect(page.locator("#auth-screen__main--signin")).toBeVisible();

    await page.locator("#auth-screen__link--switch-mode").click();
    await expect(page.locator("#auth-screen__main--signup")).toBeVisible();
  });

  test("le retour ramène à l'accueil", async ({ page }) => {
    await page.goto("/");
    await page.locator("#welcome__button--sign-in").click();
    await expect(page.locator("#auth-screen__main--signin")).toBeVisible();

    await page.getByRole("button", { name: "Retour à l'accueil" }).click();
    await expect(page.locator("#welcome__title--main")).toBeVisible();
  });

  test("un retour de lien magique en erreur ouvre la connexion avec le message", async ({ page }) => {
    await page.goto("/auth/callback#error=access_denied&error_code=otp_expired");

    await expect(page).toHaveURL(/\/connexion$/);
    await expect(page.locator("#auth-screen__main--signin")).toBeVisible();
  });

  test("un email mal formé ne peut pas être envoyé", async ({ page }) => {
    await page.goto("/");
    await page.locator("#welcome__button--sign-up").click();
    await page.locator("#auth-screen__button--email-link").click();

    await page.locator("#magic-link-request__input--email").fill("pas-un-email");

    await expect(page.locator("#magic-link-request__button--send")).toBeDisabled();
    await expect(page.locator("#magic-link-confirmation__main--root")).toHaveCount(0);
  });

  test("le lien magique est envoyé et reçu dans Mailpit", async ({ page }) => {
    const email = uniqueEmail("magic-link");
    await page.goto("/");
    await page.locator("#welcome__button--sign-in").click();
    await page.locator("#auth-screen__button--email-link").click();

    await page.locator("#magic-link-request__input--email").fill(email);
    await page.locator("#magic-link-request__button--send").click();

    await expect(page.locator("#magic-link-confirmation__main--root")).toBeVisible();
    await expect(page.locator("#magic-link-confirmation__text--address")).toHaveText(email);

    const message = await waitForEmail(email);
    expect(message.HTML + message.Text).toMatch(/https?:\/\//);
  });

  test("depuis le mode découverte, la création de compte conserve l'espace de l'utilisateur", async ({ page }) => {
    await completeOnboarding(page);
    await askQuestions(page, 4);
    await page.locator("#app__tabbar--main-consult").click();
    await page.locator("#discovery-quota-gate__button--sign-up").click();
    await page.locator("#auth-screen__button--email-link").click();

    await page.locator("#magic-link-request__input--email").fill(uniqueEmail("upgrade"));
    await page.locator("#magic-link-request__button--send").click();

    await expect(page.locator("#migration__title--main")).toBeVisible();
    await page.locator("#migration__button--continue").click();
    await expect(page.locator("#app__shell--root")).toBeVisible();
    await expect(page.locator("#discovery-mode-badge__badge--main")).toHaveCount(0);
  });
});
