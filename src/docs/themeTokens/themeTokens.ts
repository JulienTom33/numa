import themeCss from "../../index.css?raw";

export type TokenMap = Record<string, string>;

export function readThemeTokens(css: string, namespace: string): TokenMap {
  const theme = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const declaration = new RegExp(`--${namespace}-([a-z0-9-]+)\\s*:\\s*([^;]+);`, "g");
  const tokens: TokenMap = {};
  for (const [, name, value] of theme.matchAll(declaration)) {
    if (!name.includes("--")) tokens[name] = value.trim();
  }
  return tokens;
}

export function pickTokens(tokens: TokenMap, ...prefixes: string[]): TokenMap {
  return Object.fromEntries(
    Object.entries(tokens).filter(([name]) =>
      prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}-`)),
    ),
  );
}

export const colors = readThemeTokens(themeCss, "color");
