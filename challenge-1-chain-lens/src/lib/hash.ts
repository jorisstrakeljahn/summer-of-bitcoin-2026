/**
 * Cryptographic hash functions for Bitcoin.
 * Uses Node.js built-in crypto module — no external dependencies needed.
 */

import { createHash } from "crypto";

/** Single SHA-256 hash. */
export function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

/** Double SHA-256 (SHA256d) — used for txid, block hash, merkle nodes. */
export function sha256d(data: Buffer): Buffer {
  return sha256(sha256(data));
}

/** RIPEMD-160 hash. */
export function ripemd160(data: Buffer): Buffer {
  return createHash("ripemd160").update(data).digest();
}

/** HASH160 = RIPEMD160(SHA256(data)) — used for P2PKH, P2SH address hashes. */
export function hash160(data: Buffer): Buffer {
  return ripemd160(sha256(data));
}

/** Reverse a buffer (returns a new buffer). Used for display-order txid/block hash. */
export function reverseBuffer(buf: Buffer): Buffer {
  const reversed = Buffer.allocUnsafe(buf.length);
  for (let i = 0; i < buf.length; i++) {
    reversed[i] = buf[buf.length - 1 - i];
  }
  return reversed;
}
