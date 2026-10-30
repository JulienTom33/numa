import { type Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { completeOnboarding } from "../support/discovery";

const MONTHLY_URL = "**/functions/v1/horoscope-monthly";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

const FALLBACK_BODY = {
  horoscope: {
    monthStart: "2026-10-01",
    monthEnd: "2026-10-31",
    sections: null,
    basis: {
      ascendantKnown: true,
      events: {
        ingresses: [{ body: "venus", to: "scorpio", at: "2026-10-18T08:00:00Z" }],
        stations: [],
        moonPhases: [{ phase: "full_moon", at: "2026-10-26T12:00:00Z" }],
        eclipses: [],
      },
      aspects: [{ bodyA: "jupiter", bodyB: "saturn", type: "square", orb: 0.8 }],
    },
  },
};

async function mockMonthly(page: Page, respond: "fallback" | "failure") {
  await page.route(MONTHLY_URL, async (route) => {
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

test.describe("Horoscope mensuel", () => {
  test("bascule du jour au mois puis revient au jour", async ({ page }) => {
    await completeOnboarding(page);
    await expect(page.locator("#horoscope__card--root")).toBeVisible();

    await page.locator("#today__control--period-month").click();

    await expect(page.locator("#monthly-horoscope__card--root")).toBeVisible();
    await expect(page.locator("#horoscope__card--root")).toHaveCount(0);
    await expect(page.locator("#monthly-horoscope__text--range")).toBeVisible();
    for (const section of ["general", "relations", "work", "energy"]) {
      await expect(page.locator(`#monthly-horoscope__text--${section}`)).toContainText("Lecture de test déterministe");
    }

    await page.locator("#monthly-horoscope__button--why").click();
    await expect(page.locator("#monthly-horoscope__text--why-disclaimer")).toBeVisible();

    await page.locator("#today__control--period-day").click();

    await expect(page.locator("#horoscope__card--root")).toBeVisible();
    await expect(page.locator("#monthly-horoscope__card--root")).toHaveCount(0);
  });

  test("affiche le fondement calculé quand la rédaction est indisponible", async ({ page }) => {
    await mockMonthly(page, "fallback");
    await completeOnboarding(page);

    await page.locator("#today__control--period-month").click();

    await expect(page.locator("#monthly-horoscope__text--fallback")).toBeVisible();
    await expect(page.locator("#monthly-horoscope__list--sections")).toHaveCount(0);
    await expect(page.locator("#monthly-horoscope__list--events")).toContainText("Vénus entre en Scorpion");
    await expect(page.locator("#monthly-horoscope__list--events")).toContainText("Pleine Lune");
    await expect(page.locator("#monthly-horoscope__list--aspects")).toContainText("Jupiter en carré avec saturne");
  });

  test("propose de réessayer après une erreur puis affiche la lecture", async ({ page }) => {
    await mockMonthly(page, "failure");
    await completeOnboarding(page);

    await page.locator("#today__control--period-month").click();
    await expect(page.locator("#monthly-horoscope__callout--error")).toBeVisible();

    await page.unroute(MONTHLY_URL);
    await page.locator("#monthly-horoscope__button--retry").click();

    await expect(page.locator("#monthly-horoscope__text--general")).toContainText("Lecture de test déterministe");
  });
});
