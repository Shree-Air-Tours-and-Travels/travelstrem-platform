import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@packages/trem-ui": path.resolve(configDirectory, "../trem-ui/src/index.js"),
      "@packages/trem-utils": path.resolve(configDirectory, "../trem-utils/src/index.js"),
      "@packages/trem-modals": path.resolve(configDirectory, "../trem-modals/src/index.js"),
    },
  },
  test: {
    css: false,
  },
});
