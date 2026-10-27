import { expect, test as base } from "@playwright/test";

interface Fixtures {
  cookieConsent: "accepted" | "refused" | null;
}

export const test = base.extend<Fixtures>({
  cookieConsent: ["accepted", { option: true }],
  context: async ({ context, baseURL, cookieConsent }, provide) => {
    if (cookieConsent && baseURL) {
      await context.addCookies([{ name: "sidera-cookie-consent", value: cookieConsent, url: baseURL }]);
    }
    await provide(context);
  },
});

export { expect };
