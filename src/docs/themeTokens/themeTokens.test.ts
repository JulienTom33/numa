import { colors, pickTokens, readThemeTokens } from "./themeTokens";

const sample = `
@import "tailwindcss";
@theme {
  --color-*: initial;
  --color-ink: #20243A;
  --color-ink-muted: #8C90A0;
  --color-overlay: rgb(32 36 58 / 0.35);
  --text-tab: 10.5px;
  --text-tab--line-height: 14px;
}
.outside { --color-ghost: red; }
`;

describe("readThemeTokens", () => {
  it("reads the tokens of a namespace from the @theme block only", () => {
    expect(readThemeTokens(sample, "color")).toEqual({
      ink: "#20243A",
      "ink-muted": "#8C90A0",
      overlay: "rgb(32 36 58 / 0.35)",
    });
  });

  it("ignores the sub-properties of a token", () => {
    expect(readThemeTokens(sample, "text")).toEqual({ tab: "10.5px" });
  });

  it("returns nothing without an @theme block", () => {
    expect(readThemeTokens(".a { color: red; }", "color")).toEqual({});
  });
});

describe("pickTokens", () => {
  it("keeps a token and its variants, not tokens sharing a prefix", () => {
    const tokens = { ink: "1", "ink-muted": "2", inkwell: "3", coral: "4" };
    expect(pickTokens(tokens, "ink")).toEqual({ ink: "1", "ink-muted": "2" });
  });
});

describe("colors", () => {
  // Garde-fou : la palette Sidéra est la seule source des pages Fondations.
  it("exposes exactly the Sidéra palette declared in src/index.css", () => {
    expect(Object.keys(colors)).toHaveLength(26);
    expect(colors.coral).toBe("#F27D72");
    expect(colors["violet-ink"]).toBe("#6E5A99");
    expect(colors).not.toHaveProperty("black");
  });
});
