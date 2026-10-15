import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import i18next from "eslint-plugin-i18next";
import tseslint from "typescript-eslint";

const allowedDirective = /^\s*(eslint|global\s|@ts-|\/\s*<reference\s)/;

const noComments = {
  meta: {
    type: "suggestion",
    messages: {
      forbidden: "Aucun commentaire hors JSDoc et fichiers de test (voir docs/claude/development.md).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const isJsDoc = comment.type === "Block" && comment.value.startsWith("*");
          if (!isJsDoc && !allowedDirective.test(comment.value)) {
            context.report({ loc: comment.loc, messageId: "forbidden" });
          }
        }
      },
    };
  },
};

export default tseslint.config(
  { ignores: ["dist", "coverage", "storybook-static", "supabase/functions", "!.storybook"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      numa: { rules: { "no-comments": noComments } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": "error",
      "numa/no-comments": "error",
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
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    rules: {
      "numa/no-comments": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
);
