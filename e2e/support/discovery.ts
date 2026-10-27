import { expect, type Page } from "@playwright/test";
import { loadSupabaseEnv } from "./env";
import { BORDEAUX, mockGeocode } from "./geocode";

export type BirthTime = "exact" | "unknown";

export interface OnboardingOptions {
  firstName?: string;
  birthTime?: BirthTime;
}

export async function startDiscovery(page: Page): Promise<void> {
  await mockGeocode(page);
  await page.goto("/");
  await page.locator("#welcome__link--discover").click();
  await expect(page.locator("#name-step__input--name")).toBeVisible();
}

export async function fillOnboarding(page: Page, options: OnboardingOptions = {}): Promise<void> {
  const { firstName = "Camille", birthTime = "exact" } = options;

  await page.locator("#name-step__input--name").fill(firstName);
  await page.locator("#name-step__form--main-continue").click();

  await page.locator("#date-step__select--day").selectOption("15");
  await page.locator("#date-step__select--month").selectOption("3");
  await page.locator("#date-step__select--year").selectOption("1990");
  await expect(page.locator("#date-step__callout--confirmation")).toBeVisible();
  await page.locator("#date-step__form--main-continue").click();

  if (birthTime === "exact") {
    await page.getByRole("radio", { name: /Heure exacte/ }).check();
    await page.locator("#time-step__input--exact-time").fill("14:30");
  } else {
    await page.getByRole("radio", { name: /Heure inconnue/ }).check();
  }
  await page.locator("#onboarding-flow__form--time-continue").click();

  await page.locator("#onboarding-flow__place-step--birth-place-city").fill("Bordeaux");
  await page.getByRole("option", { name: new RegExp(BORDEAUX.name) }).click();
  await expect(page.locator("#onboarding-flow__place-step--birth-place-selected")).toBeVisible();
  await page.locator("#onboarding-flow__form--place-continue").click();

  await expect(page.locator("#summary-step__form--main")).toBeVisible();
  await page.locator("#summary-step__form--main-continue").click();

  await expect(page.locator("#ascendant-step__form--main")).toBeVisible();
  if (birthTime === "unknown") {
    await page.getByRole("radio", { name: "Non" }).check();
  }
  await page.locator("#ascendant-step__form--main-continue").click();
}

export async function completeOnboarding(page: Page, options: OnboardingOptions = {}): Promise<void> {
  await startDiscovery(page);
  await fillOnboarding(page, options);
  await expect(page.locator("#chart-summary__section--root")).toBeVisible();
  await page.locator("#chart-summary__button--discover").click();
  await expect(page.locator("#app__shell--root")).toBeVisible();
}

export async function askQuestions(page: Page, count: number): Promise<void> {
  const { apiUrl, publishableKey } = loadSupabaseEnv();
  const accessToken = await page.evaluate(() => {
    const cookies = new Map<string, string>();
    document.cookie.split("; ").forEach((part) => {
      const separator = part.indexOf("=");
      if (separator > 0) cookies.set(decodeURIComponent(part.slice(0, separator)), decodeURIComponent(part.slice(separator + 1)));
    });
    const key = [...cookies.keys()].find((name) => /^sb-.*-auth-token$/.test(name));
    if (!key) return null;
    const marker = cookies.get(key) ?? "";
    let raw = marker;
    if (marker.startsWith("__chunks:")) {
      raw = "";
      for (let index = 0; index < Number.parseInt(marker.slice(9), 10); index += 1) {
        raw += cookies.get(`${key}.${index}`) ?? "";
      }
    }
    const session = JSON.parse(raw || "null") as { access_token?: string } | null;
    return session?.access_token ?? null;
  });
  expect(accessToken).not.toBeNull();

  for (let index = 0; index < count; index += 1) {
    const response = await page.request.post(`${apiUrl}/functions/v1/chat`, {
      headers: { apikey: publishableKey, authorization: `Bearer ${accessToken}` },
      data: { question: `Question de test ${index + 1}` },
    });
    expect(response.ok()).toBe(true);
  }
}
