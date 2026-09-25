import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ["@packages/trem-design-tokens"],
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/partnership.html", destination: "/partnership", permanent: true },
      { source: "/partner", destination: "/partnership", permanent: true }
    ];
  }
};

export default nextConfig;
