import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bech32", "bs58check"],
  transpilePackages: [],
};

export default nextConfig;
