import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/mission-control/' : '',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
