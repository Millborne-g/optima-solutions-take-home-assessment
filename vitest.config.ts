import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      // Match tsconfig paths: @/ -> repo root
      "@": path.resolve(__dirname, "."),
      // Mock server-only in tests so server modules can be imported
      "server-only": path.resolve(__dirname, "__mocks__/server-only.ts"),
    },
  },
});
