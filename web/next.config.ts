import type { NextConfig } from "next";
import path from "path";

const rootDir = path.resolve(__dirname, "..");

const nextConfig: NextConfig = {
  serverExternalPackages: ["bitcoinjs-lib", "tiny-secp256k1", "ecpair"],
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
