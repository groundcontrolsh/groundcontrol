/// <reference types="vitest" />
import { defineConfig } from "vite";

import * as jsdom from "jsdom";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    // testMatch: ["./**/*.test.tsx"],
    globals: true,
  },
});
