import { describe, expect, it } from "vitest";
import { getSignLabel } from "./zodiac";
import { ZODIAC_SIGNS } from "../../../../shared/zodiac/zodiac.ts";

describe("zodiac", () => {
  it("lists the 12 signs in zodiac order", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    expect(ZODIAC_SIGNS[0]).toBe("aries");
    expect(ZODIAC_SIGNS[11]).toBe("pisces");
  });

  it("returns the French label of a sign", () => {
    expect(getSignLabel("libra")).toBe("Balance");
    expect(getSignLabel("gemini")).toBe("Gémeaux");
  });
});
