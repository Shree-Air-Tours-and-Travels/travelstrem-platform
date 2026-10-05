import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  distDir: process.env.WEBSITE_DIST_DIR || ".next",
  transpilePackages: ["@packages/trem-design-tokens"],
};
export default config;
