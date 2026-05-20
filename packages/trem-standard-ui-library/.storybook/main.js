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
          {
            find: /^@storybook\/react\/dist\/entry-preview\.mjs$/,
            replacement: path.join(
              repoRoot,
              "node_modules/.pnpm/@storybook+react@8.6.18_react-dom@18.3.1_react@18.3.1__react@18.3.1_storybook@8.6.18_typescript@4.9.5/node_modules/@storybook/react/dist/entry-preview.mjs",
            ),
          },
          {
            find: /^@storybook\/react\/dist\/entry-preview-docs\.mjs$/,
            replacement: path.join(
              repoRoot,
              "node_modules/.pnpm/@storybook+react@8.6.18_react-dom@18.3.1_react@18.3.1__react@18.3.1_storybook@8.6.18_typescript@4.9.5/node_modules/@storybook/react/dist/entry-preview-docs.mjs",
            ),
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
