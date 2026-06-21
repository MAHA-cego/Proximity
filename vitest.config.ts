import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@proximity/simulation": path.resolve(
        __dirname,
        "packages/simulation/src/index.ts",
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
