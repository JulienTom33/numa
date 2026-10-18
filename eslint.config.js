import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import i18next from "eslint-plugin-i18next";
import tseslint from "typescript-eslint";

const allowedDirective = /^\s*(eslint|global\s|@ts-|\/\s*<reference\s)/;

const functionTypes = new Set(["FunctionDeclaration", "ArrowFunctionExpression", "FunctionExpression"]);

function isExportedFunction(node) {
  const declaration = node.declaration;
  if (!declaration) return false;
  if (functionTypes.has(declaration.type)) return true;
  return (
    declaration.type === "VariableDeclaration" &&
    declaration.declarations.length > 0 &&
    declaration.declarations.every((item) => item.init && functionTypes.has(item.init.type))
  );
}

const noComments = {
  meta: {
    type: "suggestion",
    messages: {
      forbidden:
        "Aucun commentaire hors JSDoc de fonction exportée et fichiers de test (voir docs/claude/development.md).",
    },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    const allowedJsDoc = new Set();

    function collectJsDoc(node) {
      if (!isExportedFunction(node)) return;
      const jsDoc = sourceCode.getCommentsBefore(node).at(-1);
      if (jsDoc && jsDoc.type === "Block" && jsDoc.value.startsWith("*")) allowedJsDoc.add(jsDoc);
    }

    return {
      ExportNamedDeclaration: collectJsDoc,
      ExportDefaultDeclaration: collectJsDoc,
      "Program:exit"() {
        for (const comment of sourceCode.getAllComments()) {
          if (!allowedJsDoc.has(comment) && !allowedDirective.test(comment.value)) {
            context.report({ loc: comment.loc, messageId: "forbidden" });
          }
        }
      },
    };
  },
};

export default tseslint.config(
  { ignores: ["dist", "coverage", "storybook-static", "supabase/functions", "shared/database.types.ts", "!.storybook"] },
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
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/**/*.stories.{ts,tsx}", "src/test/**", "src/docs/**"],
    rules: {
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 12],
      "@typescript-eslint/consistent-type-imports": "error",
      eqeqeq: "error",
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
