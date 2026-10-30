import { expect, test } from "../support/test";
import { askQuestions, completeOnboarding } from "../support/discovery";

test.describe("Chat Sidéra", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
    await page.locator("#app__tabbar--main-consult").click();
  });

  test("état vide : profil, suggestions et quota visibles", async ({ page }) => {
    await expect(page.locator("#chat-view__intro--empty")).toBeVisible();
    await expect(page.locator("#chat-profile-badge__badge--main")).toContainText("Profil analysé");
    await expect(page.locator("#chat-suggestions__chip--week")).toBeVisible();
    await expect(page.locator("#chat-view__text--quota")).toContainText("4 questions gratuites");
    await expect(page.locator("#chat-view__text--origin")).toContainText("moteur astronomique");
  });

  test("indication de confidentialité visible sous la saisie", async ({ page }) => {
    await expect(page.locator("#chat-view__text--privacy-hint")).toContainText("Évitez d'y saisir e-mail");
  });

  test("une suggestion envoie la question et affiche une réponse", async ({ page }) => {
    await page.locator("#chat-suggestions__chip--week").click();

    await expect(page.locator("#chat-message-list__message--m1")).toBeVisible();
    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();
    await expect(page.locator("#chat-message-list__message--m2")).toContainText("Réponse de test déterministe");
    await expect(page.locator("#chat-view__text--quota")).toContainText("3 questions gratuites restantes");
  });

  test("envoi au clavier d'une question libre", async ({ page }) => {
    await page.locator("#chat-view__input--question").fill("Que dit mon thème ?");
    await page.locator("#chat-view__input--question").press("Enter");

    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();
  });

  test("inscription proposée seulement après la quatrième réponse, refus sans perte de la conversation", async ({ page }) => {
    await page.locator("#chat-suggestions__chip--week").click();
    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();

    for (const [index, id] of ["m4", "m6", "m8"].entries()) {
      await expect(page.locator("#signup-prompt__dialog--main")).toBeHidden();
      await page.locator("#chat-view__input--question").fill("Question " + (index + 2));
      await page.locator("#chat-view__input--question").press("Enter");
      await expect(page.locator("#chat-message-list__message--" + id)).toBeVisible();
    }

    await expect(page.locator("#signup-prompt__dialog--main")).toBeVisible();
    await expect(page.locator("#signup-prompt__list--benefits")).toBeVisible();
    await expect(page.locator("#signup-prompt__button--sign-up")).toBeVisible();
    await expect(page.locator("#signup-prompt__button--sign-in")).toBeVisible();

    await page.locator("#signup-prompt__link--continue").click();
    await expect(page.locator("#signup-prompt__dialog--main")).toBeHidden();
    await expect(page.locator("#chat-message-list__message--m8")).toBeVisible();
  });

  test("le fondement de la réponse affiche positions et période non disponible", async ({ page }) => {
    await page.locator("#chat-suggestions__chip--week").click();
    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();
    await expect(page.locator("#chat-message-list__message--m2")).toContainText("non disponible");

    await page.locator("#chat-message-list__message--m2-why").click();

    await expect(page.locator("#chat-answer-basis__section--m2-placements")).toBeVisible();
    await expect(page.locator("#chat-answer-basis__section--m2-body--sun")).toBeVisible();
    await expect(page.locator("#chat-answer-basis__section--m2-ascendant")).toBeVisible();
    await expect(page.locator("#chat-message-list__message--m1-why")).toHaveCount(0);
  });

  test("quota atteint : la saisie est bloquée", async ({ page }) => {
    await askQuestions(page, 4);
    await page.reload();
    await page.locator("#app__tabbar--main-consult").click();

    await expect(page.locator("#chat-view__callout--exhausted")).toBeVisible();
    await expect(page.locator("#chat-view__input--question")).toBeDisabled();
  });
});

test.describe("Chat Sidéra, heure de naissance inconnue", () => {
  test("le fondement signale l'incertitude et l'ascendant indisponible", async ({ page }) => {
    await completeOnboarding(page, { birthTime: "unknown" });
    await page.locator("#app__tabbar--main-consult").click();
    await page.locator("#chat-suggestions__chip--week").click();
    await expect(page.locator("#chat-message-list__message--m2")).toBeVisible();

    await page.locator("#chat-message-list__message--m2-why").click();

    await expect(page.locator("#chat-answer-basis__section--m2-angles-unavailable")).toBeVisible();
    await expect(page.locator("#chat-answer-basis__section--m2-warning--unknown_time")).toBeVisible();
  });
});
