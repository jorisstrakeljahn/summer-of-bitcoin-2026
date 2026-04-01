/**
 * Cryptographic hash functions for Bitcoin.
 * Uses Node.js built-in crypto module — no external dependencies needed.
 */

import { createHash } from "crypto";

export function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

export function sha256d(data: Buffer): Buffer {
  return sha256(sha256(data));
}

export function ripemd160(data: Buffer): Buffer {
  return createHash("ripemd160").update(data).digest();
}

export function hash160(data: Buffer): Buffer {
  return ripemd160(sha256(data));
}

export function reverseBuffer(buf: Buffer): Buffer {
  const reversed = Buffer.allocUnsafe(buf.length);
  for (let i = 0; i < buf.length; i++) {
    reversed[i] = buf[buf.length - 1 - i];
  }
  return reversed;
}
