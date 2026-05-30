import { mergeConfig } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        "process.env": JSON.stringify({
          REACT_APP_API_URL: "",
        }),
      },
      resolve: {
        alias: [
          {
            find: /^@packages\/trem-design-tokens\/scss$/,
            replacement: path.join(repoRoot, "packages/trem-design-tokens/src/scss/index.scss"),
          },
          {
            find: /^@packages\/trem-design-tokens$/,
            replacement: path.join(repoRoot, "packages/trem-design-tokens/src/index.js"),
          },
          {
            find: /^@packages\/trem-ui$/,
            replacement: path.join(repoRoot, "packages/trem-ui/src/index.js"),
          },
          {
            find: /^@packages\/trem-utils$/,
            replacement: path.join(repoRoot, "packages/trem-utils/src/index.js"),
          },
        ],
      },
      server: {
        fs: {
          allow: [repoRoot],
        },
      },
    });
  },
};

export default config;
