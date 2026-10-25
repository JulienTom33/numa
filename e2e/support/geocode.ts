import type { Page } from "@playwright/test";

export const BORDEAUX = {
  id: "3031582",
  name: "Bordeaux",
  region: "Nouvelle-Aquitaine",
  country: "France",
  countryCode: "FR",
  label: "Bordeaux, Nouvelle-Aquitaine, France",
  latitude: 44.84474,
  longitude: -0.58046,
  timezone: "Europe/Paris",
};

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

export async function mockGeocode(page: Page): Promise<void> {
  await page.route("**/functions/v1/geocode", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: CORS_HEADERS,
      contentType: "application/json",
      body: JSON.stringify({ places: [BORDEAUX] }),
    });
  });
}

export async function mockGeocodeUnavailable(page: Page): Promise<void> {
  await page.route("**/functions/v1/geocode", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: 503,
      headers: CORS_HEADERS,
      contentType: "text/plain",
      body: "Service Temporarily Unavailable",
    });
  });
}
