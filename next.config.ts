import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark native modules as server-side externals (works with both webpack and Turbopack)
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
