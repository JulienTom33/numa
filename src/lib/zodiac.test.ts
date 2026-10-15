import { describe, expect, it } from "vitest";
import { getSignLabel, ZODIAC_SIGNS } from "./zodiac";

describe("zodiac", () => {
  it("lists the 12 signs in zodiac order", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    expect(ZODIAC_SIGNS[0].value).toBe("aries");
    expect(ZODIAC_SIGNS[11].value).toBe("pisces");
  });

  it("returns the French label of a sign", () => {
    expect(getSignLabel("libra")).toBe("Balance");
    expect(getSignLabel("gemini")).toBe("Gémeaux");
  });
});
