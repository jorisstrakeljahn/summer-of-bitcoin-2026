/**
 * Transaction serialization for txid/wtxid computation.
 *
 * txid  = SHA256d of the legacy serialization (no marker, no witness)
 * wtxid = SHA256d of the full serialization (with marker + flag + witness)
 */

import { createHash } from "crypto";
import { sha256d, reverseBuffer } from "./hash.js";
import type { ParsedTransaction } from "./types.js";

/**
 * Compute the raw txid hash (internal byte order, not reversed).
 *
 * For SegWit transactions, streams legacy bytes directly from rawBuffer
 * to avoid allocating a separate legacy serialization buffer.
 *
 * SegWit raw:    [version:4][marker:1][flag:1][inputs+outputs][witness][locktime:4]
 * Legacy needed: [version:4][inputs+outputs][locktime:4]
 */
export function computeTxidBuffer(tx: ParsedTransaction): Buffer {
  if (!tx.segwit) {
    return sha256d(tx.rawBuffer);
  }

  const raw = tx.rawBuffer;
  const middleLen = tx.nonWitnessBytes - 8;

  const inner = createHash("sha256");
  inner.update(raw.subarray(0, 4));
  inner.update(raw.subarray(6, 6 + middleLen));
  inner.update(raw.subarray(raw.length - 4));

  return createHash("sha256").update(inner.digest()).digest();
}

export function computeTxid(tx: ParsedTransaction): string {
  return reverseBuffer(computeTxidBuffer(tx)).toString("hex");
}

export function computeWtxid(tx: ParsedTransaction): string | null {
  if (!tx.segwit) return null;
  return reverseBuffer(sha256d(tx.rawBuffer)).toString("hex");
}
