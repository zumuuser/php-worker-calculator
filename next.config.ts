import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  basePath: "/php-worker-calculator",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
