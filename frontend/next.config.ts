import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Fix for Aceternity UI and other dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        bufferutil: false,
        "utf-8-validate": false,
      };
    }
    return config;
  },
  transpilePackages: ["aceternity-ui"],
};

export default nextConfig;
