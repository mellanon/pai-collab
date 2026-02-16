import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: [],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/config/**"],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 80,
        statements: 85,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@quarantine": path.resolve(__dirname, "./src/quarantine"),
      "@config": path.resolve(__dirname, "./src/config"),
    },
  },
});
