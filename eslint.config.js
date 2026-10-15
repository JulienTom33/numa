import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import i18next from "eslint-plugin-i18next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // supabase/functions : code Deno, vérifié par deno lint (job CI edge-functions).
  { ignores: ["dist", "coverage", "storybook-static", "supabase/functions", "!.storybook"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": "error",
      "no-warning-comments": ["error", { terms: ["todo", "fixme", "xxx"], location: "anywhere" }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/**/*.stories.{ts,tsx}", "src/test/**", "src/docs/**"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": ["error", { mode: "jsx-text-only" }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**", "**/*.config.{ts,js}"],
    rules: {
      "no-warning-comments": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
);
