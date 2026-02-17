/**
 * Transaction serialization for txid/wtxid computation.
 *
 * txid  = SHA256d of the legacy serialization (no marker, no witness)
 * wtxid = SHA256d of the full serialization (with marker + flag + witness)
 *
 * For legacy transactions, wtxid is null (same as txid conceptually,
 * but the spec requires null).
 */

import { sha256d, reverseBuffer } from "./hash.js";
import type { ParsedTransaction } from "./types.js";

/**
 * Compute the raw txid hash (internal byte order, not reversed).
 * Reusable for both merkle root and txid display.
 */
export function computeTxidBuffer(tx: ParsedTransaction): Buffer {
  return sha256d(serializeLegacy(tx));
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
