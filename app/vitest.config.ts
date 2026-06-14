import { defineConfig } from "vitest/config";

// Tests cover the pure service/lib logic (no React Native imports), run in Node.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
