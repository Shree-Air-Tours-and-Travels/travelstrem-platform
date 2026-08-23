import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@packages/trem-utils": path.resolve(__dirname, "../trem-utils/src"),
      "@packages/trem-ui": path.resolve(__dirname, "./src/index.js"),
      "@packages/trem-modals": path.resolve(__dirname, "../trem-modals/src/index.js"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["./src/test-setup.js"],
    css: false,
  },
});
