/**
 * Bitcoin address derivation.
 *
 * Derives addresses from scriptPubKey using:
 * - bs58check for Base58 addresses (P2PKH, P2SH)
 * - bech32 for SegWit addresses (P2WPKH, P2WSH)
 * - bech32m for Taproot addresses (P2TR)
 */

import type { OutputScriptType } from "./types.js";

// ---------------------------------------------------------------------------
// Address derivation from scriptPubKey
// ---------------------------------------------------------------------------

export function deriveAddress(
  _scriptPubKeyHex: string,
  _scriptType: OutputScriptType,
  _network: string,
): string | null {
  // TODO: Implement address derivation
  // P2PKH → bs58check.encode(Buffer.concat([0x00], hash))
  // P2SH  → bs58check.encode(Buffer.concat([0x05], hash))
  // P2WPKH → bech32.encode("bc", [0, ...program])
  // P2WSH  → bech32.encode("bc", [0, ...program])
  // P2TR   → bech32m.encode("bc", [1, ...program])
  // op_return / unknown → null
  return null;
}
