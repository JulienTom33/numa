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

  test("tronque les adresses IP analysables", () => {
    for (const field of ["request>remote_ip", "request>client_ip"]) {
      expect(caddyfile).toContain(`${field} ip_mask 16 32`);
    }
  });

  test("supprime les champs porteurs d'IP que ip_mask ne sait pas analyser", () => {
    for (const field of [
      "request>remote_addr",
      "request>headers>X-Forwarded-For",
      "request>headers>X-Real-Ip",
      "request>headers>Forwarded",
    ]) {
      expect(caddyfile).toMatch(new RegExp(`^\\s*${field} delete$`, "m"));
    }
  });
});
