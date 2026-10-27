import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "../support/test";
import { loadSupabaseEnv } from "../support/env";

function loadCaddyCsp(supabaseUrl: string): string {
  const caddyfile = readFileSync(resolve(process.cwd(), "Caddyfile"), "utf8");
  const match = /Content-Security-Policy\s+"([^"]+)"/.exec(caddyfile);
  if (!match) throw new Error("Content-Security-Policy introuvable dans le Caddyfile.");
  return match[1].replaceAll("{$SUPABASE_URL}", supabaseUrl);
}

test.describe("Content-Security-Policy du Caddyfile", () => {
  test("le Caddyfile déclare les directives strictes attendues", () => {
    const csp = loadCaddyCsp("http://supabase.test");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("connect-src 'self' http://supabase.test");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  test("le parcours principal s'exécute sans violation CSP", async ({ page }) => {
    const csp = loadCaddyCsp(loadSupabaseEnv().apiUrl);
    const violations: string[] = [];

    await page.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": csp },
      });
    });
    await page.exposeFunction("reportCspViolation", (detail: string) => {
      violations.push(detail);
    });
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        const report = (window as unknown as { reportCspViolation: (detail: string) => void }).reportCspViolation;
        report(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    page.on("console", (message) => {
      if (message.text().includes("Content Security Policy")) violations.push(message.text());
    });

    await page.goto("/");
    await expect(page.locator("#welcome__title--main")).toBeVisible();
    await page.goto("/confidentialite");
    await expect(page.locator("#privacy-policy__main--root")).toBeVisible();

    expect(violations).toEqual([]);
  });
});
