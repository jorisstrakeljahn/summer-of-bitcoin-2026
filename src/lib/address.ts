/**
 * Bitcoin address derivation from scriptPubKey.
 *
 * Uses:
 * - bs58check for Base58 addresses (P2PKH, P2SH)
 * - bech32 for SegWit v0 addresses (P2WPKH, P2WSH)
 * - bech32m for SegWit v1+ addresses (P2TR)
 */

import bs58check from "bs58check";
import { bech32, bech32m } from "bech32";
import type { OutputScriptType } from "./types.js";

const NETWORK_PREFIXES: Record<string, { p2pkh: number; p2sh: number; bech32: string }> = {
  mainnet: { p2pkh: 0x00, p2sh: 0x05, bech32: "bc" },
  testnet: { p2pkh: 0x6f, p2sh: 0xc4, bech32: "tb" },
  signet:  { p2pkh: 0x6f, p2sh: 0xc4, bech32: "tb" },
  regtest: { p2pkh: 0x6f, p2sh: 0xc4, bech32: "bcrt" },
};

/**
 * Derive a human-readable address from a scriptPubKey.
 * Returns null for op_return, unknown, or unsupported networks.
 */
export function deriveAddress(
  scriptPubKeyHex: string,
  scriptType: OutputScriptType,
  network: string,
): string | null {
  const prefix = NETWORK_PREFIXES[network];
  if (!prefix) return null;

  switch (scriptType) {
    case "p2pkh": {
      const hash = Buffer.from(scriptPubKeyHex.slice(6, 46), "hex"); // 76a914{hash}88ac
      return encodeBase58Check(prefix.p2pkh, hash);
    }
    case "p2sh": {
      const hash = Buffer.from(scriptPubKeyHex.slice(4, 44), "hex"); // a914{hash}87
      return encodeBase58Check(prefix.p2sh, hash);
    }
    case "p2wpkh": {
      const program = Buffer.from(scriptPubKeyHex.slice(4), "hex"); // 0014{program}
      return encodeBech32(prefix.bech32, 0, program);
    }
    case "p2wsh": {
      const program = Buffer.from(scriptPubKeyHex.slice(4), "hex"); // 0020{program}
      return encodeBech32(prefix.bech32, 0, program);
    }
    case "p2tr": {
      const program = Buffer.from(scriptPubKeyHex.slice(4), "hex"); // 5120{program}
      return encodeBech32m(prefix.bech32, 1, program);
    }
    default:
      return null;
  }
}

function encodeBase58Check(version: number, hash: Buffer): string {
  const payload = Buffer.alloc(1 + hash.length);
  payload[0] = version;
  hash.copy(payload, 1);
  return bs58check.encode(payload);
}

function encodeBech32(hrp: string, version: number, program: Buffer): string {
  const words = bech32.toWords(program);
  words.unshift(version);
  return bech32.encode(hrp, words);
}

function encodeBech32m(hrp: string, version: number, program: Buffer): string {
  const words = bech32m.toWords(program);
  words.unshift(version);
  return bech32m.encode(hrp, words);
}
