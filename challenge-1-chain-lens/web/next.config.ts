import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tsx"],
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
