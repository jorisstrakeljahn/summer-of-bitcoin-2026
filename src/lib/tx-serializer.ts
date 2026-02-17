/**
 * Transaction serialization for txid/wtxid computation.
 *
 * txid  = SHA256d of the legacy serialization (no marker, no witness)
 * wtxid = SHA256d of the full serialization (with marker + flag + witness)
 *
 * For legacy transactions, wtxid is null (same as txid conceptually,
 * but the spec requires null).
 */

import { createHash } from "crypto";
import { sha256d, reverseBuffer } from "./hash.js";
import type { ParsedTransaction } from "./types.js";

/**
 * Compute the raw txid hash (internal byte order, not reversed).
 * Reusable for both merkle root and txid display.
 *
 * For SegWit: extracts legacy bytes directly from rawBuffer via streaming
 * SHA256d, avoiding serializeLegacy() which creates many small buffer
 * allocations. This is critical for block mode with 300K+ transactions.
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

/**
 * Compute txid from a parsed transaction.
 * Always uses legacy serialization (no witness data).
 */
export function computeTxid(tx: ParsedTransaction): string {
  return reverseBuffer(computeTxidBuffer(tx)).toString("hex");
}

/**
 * Compute wtxid from a parsed transaction.
 * Returns null for legacy (non-segwit) transactions.
 */
export function computeWtxid(tx: ParsedTransaction): string | null {
  if (!tx.segwit) return null;
  // The raw buffer IS the full witness serialization
  return reverseBuffer(sha256d(tx.rawBuffer)).toString("hex");
}

/**
 * Serialize a transaction in legacy format (no marker, flag, or witness).
 * Used for txid and merkle root computation.
 */
export function serializeLegacy(tx: ParsedTransaction): Buffer {
  const parts: Buffer[] = [];

  // Version (4 bytes LE)
  const version = Buffer.alloc(4);
  version.writeUInt32LE(tx.version);
  parts.push(version);

  // Input count
  parts.push(writeCompactSize(tx.inputs.length));

  // Inputs
  for (const input of tx.inputs) {
    parts.push(reverseHexToBuffer(input.txid)); // txid in internal byte order
    const vout = Buffer.alloc(4);
    vout.writeUInt32LE(input.vout);
    parts.push(vout);
    parts.push(writeCompactSize(input.scriptSig.length));
    parts.push(input.scriptSig);
    const seq = Buffer.alloc(4);
    seq.writeUInt32LE(input.sequence);
    parts.push(seq);
  }

  // Output count
  parts.push(writeCompactSize(tx.outputs.length));

  // Outputs
  for (const output of tx.outputs) {
    const value = Buffer.alloc(8);
    value.writeBigUInt64LE(output.value);
    parts.push(value);
    parts.push(writeCompactSize(output.scriptPubKey.length));
    parts.push(output.scriptPubKey);
  }

  // Locktime (4 bytes LE)
  const locktime = Buffer.alloc(4);
  locktime.writeUInt32LE(tx.locktime);
  parts.push(locktime);

  return Buffer.concat(parts);
}

/** Convert a display-order hex txid back to internal byte order. */
function reverseHexToBuffer(hex: string): Buffer {
  return reverseBuffer(Buffer.from(hex, "hex"));
}

/** Encode a number as a Bitcoin CompactSize varint. */
function writeCompactSize(value: number): Buffer {
  if (value < 0xfd) {
    return Buffer.from([value]);
  }
  if (value <= 0xffff) {
    const buf = Buffer.alloc(3);
    buf[0] = 0xfd;
    buf.writeUInt16LE(value, 1);
    return buf;
  }
  if (value <= 0xffffffff) {
    const buf = Buffer.alloc(5);
    buf[0] = 0xfe;
    buf.writeUInt32LE(value, 1);
    return buf;
  }
  const buf = Buffer.alloc(9);
  buf[0] = 0xff;
  buf.writeBigUInt64LE(BigInt(value), 1);
  return buf;
}
