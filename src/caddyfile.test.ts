import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const caddyfile = readFileSync(resolve(process.cwd(), "Caddyfile"), "utf8");

describe("Caddyfile — journaux d'accès", () => {
  it("encapsule l'encodeur filter avec wrap json et un bloc fields", () => {
    const block = /format filter \{([\s\S]*?)\n\t\t\}/.exec(caddyfile);
    expect(block).not.toBeNull();
    const body = block?.[1] ?? "";
    expect(body).toMatch(/^\s*wrap json$/m);
    expect(body).toMatch(/fields \{[\s\S]*\}/);
  });

  it("masque les adresses IP dans les champs de journal concernés", () => {
    for (const field of [
      "request>remote_ip",
      "request>client_ip",
      "request>headers>X-Forwarded-For",
    ]) {
      expect(caddyfile).toContain(`${field} ip_mask 16 32`);
    }
  });
});
