import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "../support/test";

const caddyfile = readFileSync(resolve(process.cwd(), "Caddyfile"), "utf8");

test.describe("Caddyfile : journaux d'accès", () => {
  test("encapsule l'encodeur filter avec wrap json et un bloc fields", () => {
    const block = /format filter \{([\s\S]*?)\n\t\t\}/.exec(caddyfile);
    expect(block).not.toBeNull();
    const body = block?.[1] ?? "";
    expect(body).toMatch(/^\s*wrap json$/m);
    expect(body).toMatch(/fields \{[\s\S]*\}/);
  });

  test("masque les adresses IP dans les champs de journal concernés", () => {
    for (const field of ["request>remote_ip", "request>client_ip", "request>headers>X-Forwarded-For"]) {
      expect(caddyfile).toContain(`${field} ip_mask 16 32`);
    }
  });
});
