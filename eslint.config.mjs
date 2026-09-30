import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Root-centralized flat config for the whole monorepo.
// Per-app CRA configs (package.json "eslintConfig" + local eslint v8)
// remain untouched for `pnpm --filter <app> lint`; this config governs
// `npm run lint` from the repository root.
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/storybook-static/**",
      "**/*.min.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        // CRA frontends legitimately read build-time env vars
        process: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Disables all stylistic rules that conflict with Prettier
      ...prettier.rules,
      // React import is often kept for hooks/classic transforms across CRA apps.
      // Kept at "warn" to match the react-app config these projects already use.
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|^React$",
          caughtErrors: "none",
        },
      ],
      // Empty catch blocks are an accepted pattern in this codebase
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Newer ESLint rules that flag intentional patterns in this codebase
      // (control-char sanitization regexes, rethrow styles, dead stores)
      "no-control-regex": "off",
      "no-useless-assignment": "off",
      "preserve-caught-error": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Storybook story render() helpers legitimately call hooks
    files: ["**/*.stories.{js,jsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    // CRA webpack configs are the only true CommonJS files in the repo
    files: ["apps/*/craco.config.js", "apps/*/modulefederation.config.js"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.config.{js,cjs,mjs}", "scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ["apps/backend-api/src/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ["**/*.test.{js,jsx}", "**/tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.jest, ...globals.vitest },
    },
  },
];
