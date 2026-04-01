import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "bitcoinjs-lib",
    "tiny-secp256k1",
    "ecpair",
    "bech32",
    "bs58check",
    "tsx",
  ],
  outputFileTracingIncludes: {
    "/api/chain-lens/**": ["./challenge-1-chain-lens/src/**/*", "./challenge-1-chain-lens/fixtures/**/*"],
    "/api/coin-smith/**": ["./challenge-2-coin-smith/src/**/*", "./challenge-2-coin-smith/fixtures/**/*"],
    "/api/sherlock/**": ["./challenge-3-sherlock/src/**/*", "./challenge-3-sherlock/fixtures/**/*", "./challenge-3-sherlock/out/**/*"],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@chain-lens": resolve(__dirname, "challenge-1-chain-lens/src"),
      "@coin-smith": resolve(__dirname, "challenge-2-coin-smith/src"),
      "@sherlock": resolve(__dirname, "challenge-3-sherlock/src"),
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".js"],
    };
    return config;
  },
};

export default nextConfig;
