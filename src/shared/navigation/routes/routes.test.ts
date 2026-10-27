import { describe, expect, it } from "vitest";
import { paths, tabFromPathname } from "./routes";

describe("tabFromPathname", () => {
  it("returns the tab matching each tab path", () => {
    expect(tabFromPathname(paths.consult)).toBe("consult");
    expect(tabFromPathname(paths.theme)).toBe("theme");
    expect(tabFromPathname(paths.profile)).toBe("profile");
  });

  it("keeps the profile tab active on the conversation history", () => {
    expect(tabFromPathname(paths.history)).toBe("profile");
  });

  it("falls back to today for any other path", () => {
    expect(tabFromPathname(paths.today)).toBe("today");
    expect(tabFromPathname("/inconnu")).toBe("today");
  });
});
