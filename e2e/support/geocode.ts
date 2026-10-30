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

export const PARIS = {
  id: "2988507",
  name: "Paris",
  region: "Île-de-France",
  country: "France",
  countryCode: "FR",
  label: "Paris, Île-de-France, France",
  latitude: 48.85341,
  longitude: 2.3488,
  timezone: "Europe/Paris",
  arrondissements: [
    { number: 1, latitude: 48.862, longitude: 2.3359 },
    { number: 15, latitude: 48.8417, longitude: 2.2937 },
  ],
};

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

export async function mockGeocode(page: Page, places: object[] = [BORDEAUX]): Promise<void> {
  await page.route("**/functions/v1/geocode", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: CORS_HEADERS,
      contentType: "application/json",
      body: JSON.stringify({ places }),
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
