import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  lea@example.com \n")).toBe("lea@example.com");
  });
});

describe("isValidEmail", () => {
  it.each([
    "lea@example.com",
    "lea.martin@example.fr",
    "lea+numa@mail.example.co.uk",
    "l_e-a@sub-domain.example.org",
    "  lea@example.com  ",
    "LEA@EXAMPLE.COM",
  ])("accepts %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["spaces only", "   "],
    ["no @", "lea.example.com"],
    ["only @", "@"],
    ["missing local part", "@example.com"],
    ["missing domain", "lea@"],
    ["two @", "lea@@example.com"],
    ["@ in local part", "le@a@example.com"],
    ["domain without dot", "lea@example"],
    ["numeric top-level domain", "lea@example.123"],
    ["one-letter top-level domain", "lea@example.c"],
    ["leading dot in local part", ".lea@example.com"],
    ["trailing dot in local part", "lea.@example.com"],
    ["consecutive dots in local part", "le..a@example.com"],
    ["consecutive dots in domain", "lea@example..com"],
    ["domain label starting with hyphen", "lea@-example.com"],
    ["domain label ending with hyphen", "lea@example-.com"],
    ["inner space", "le a@example.com"],
    ["trailing dot in domain", "lea@example.com."],
  ])("rejects %s", (_label, email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it("rejects a local part longer than 64 characters", () => {
    expect(isValidEmail(`${"a".repeat(65)}@example.com`)).toBe(false);
  });

  it("rejects a domain label longer than 63 characters", () => {
    expect(isValidEmail(`lea@${"a".repeat(64)}.com`)).toBe(false);
  });

  it("rejects an address longer than 254 characters", () => {
    const domain = `${"a".repeat(62)}.${"b".repeat(62)}.${"c".repeat(62)}.${"d".repeat(62)}.com`;
    expect(isValidEmail(`lea@${domain}`)).toBe(false);
  });
});
