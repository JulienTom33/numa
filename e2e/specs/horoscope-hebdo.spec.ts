import { type Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

const WEEKLY_URL = "**/functions/v1/horoscope-weekly";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

const FALLBACK_BODY = {
  horoscope: {
    weekStart: "2026-10-26",
    weekEnd: "2026-11-01",
    sections: null,
    basis: {
      ascendantKnown: true,
      events: {
        ingresses: [{ body: "venus", to: "scorpio", at: "2026-10-28T08:00:00Z" }],
        stations: [],
        moonPhases: [{ phase: "full_moon", at: "2026-10-30T12:00:00Z" }],
        eclipses: [],
      },
      aspects: [{ bodyA: "mars", bodyB: "saturn", type: "square", orb: 0.8 }],
    },
  },
};

async function mockWeekly(page: Page, respond: "fallback" | "failure") {
  await page.route(WEEKLY_URL, async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    if (respond === "failure") {
      await route.fulfill({
        status: 500,
        headers: CORS_HEADERS,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "internal_error" } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: CORS_HEADERS,
      contentType: "application/json",
      body: JSON.stringify(FALLBACK_BODY),
    });
  });
}

test.describe("Horoscope hebdomadaire", () => {
  test("bascule du jour à la semaine puis revient au jour", async ({ page }) => {
    await completeOnboarding(page);
    await expect(page.locator("#horoscope__card--root")).toBeVisible();

    await page.locator("#today__control--period-week").click();

    await expect(page.locator("#weekly-horoscope__card--root")).toBeVisible();
    await expect(page.locator("#horoscope__card--root")).toHaveCount(0);
    await expect(page.locator("#weekly-horoscope__text--range")).toBeVisible();
    for (const section of ["general", "relations", "work", "energy"]) {
      await expect(page.locator(`#weekly-horoscope__text--${section}`)).toContainText("Lecture de test déterministe");
    }

    await page.locator("#weekly-horoscope__button--why").click();
    await expect(page.locator("#weekly-horoscope__text--why-disclaimer")).toBeVisible();

    await page.locator("#today__control--period-day").click();

    await expect(page.locator("#horoscope__card--root")).toBeVisible();
    await expect(page.locator("#weekly-horoscope__card--root")).toHaveCount(0);
  });

  test("affiche le fondement calculé quand la rédaction est indisponible", async ({ page }) => {
    await mockWeekly(page, "fallback");
    await completeOnboarding(page);

    await page.locator("#today__control--period-week").click();

    await expect(page.locator("#weekly-horoscope__text--fallback")).toBeVisible();
    await expect(page.locator("#weekly-horoscope__list--sections")).toHaveCount(0);
    await expect(page.locator("#weekly-horoscope__list--events")).toContainText("Vénus entre en Scorpion");
    await expect(page.locator("#weekly-horoscope__list--events")).toContainText("Pleine Lune");
    await expect(page.locator("#weekly-horoscope__list--aspects")).toContainText("Mars en carré avec saturne");
  });

  test("propose de réessayer après une erreur puis affiche la lecture", async ({ page }) => {
    await mockWeekly(page, "failure");
    await completeOnboarding(page);

    await page.locator("#today__control--period-week").click();
    await expect(page.locator("#weekly-horoscope__callout--error")).toBeVisible();

    await page.unroute(WEEKLY_URL);
    await page.locator("#weekly-horoscope__button--retry").click();

    await expect(page.locator("#weekly-horoscope__text--general")).toContainText("Lecture de test déterministe");
  });
});
