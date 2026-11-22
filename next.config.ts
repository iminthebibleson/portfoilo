import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ['100.122.101.93'],
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
