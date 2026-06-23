import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  platform: "node",
  outDir: "dist",
  clean: true,
  // Bundle workspace packages (TypeScript source) and ws so the output
  // is a self-contained JS file with no node_modules required at runtime.
  noExternal: ["@proximity/simulation", "@proximity/protocol", "ws"],
});
