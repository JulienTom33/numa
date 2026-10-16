/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: {} },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: { include: [/src\/index\.css/] },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.config.*",
        "src/main.tsx",
        "src/**/*.d.ts",
        "src/test/**",
        "dist/**",
        "storybook-static/**",
        "supabase/**",
        "scripts/**",
        "src/**/*.stories.tsx",
        "src/docs/**",
        ".storybook/**",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
