import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'next-intl/config': './src/i18n/request.ts',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'next-intl/config': path.resolve(__dirname, './src/i18n/request.ts'),
    };
    return config;
  },
};

export default nextConfig;
