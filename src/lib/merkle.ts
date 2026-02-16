/**
 * Merkle root computation for Bitcoin blocks.
 *
 * Bitcoin uses SHA256d for each node. If the number of leaves at any level
 * is odd, the last element is duplicated before hashing.
 */

import { sha256d } from "./hash.js";

/** Compute the merkle root from an array of txid buffers (internal byte order). */
export function computeMerkleRoot(txids: Buffer[]): Buffer {
  if (txids.length === 0) {
    return Buffer.alloc(32);
  }

  let level: Buffer[] = txids.map(id => Buffer.from(id));

  while (level.length > 1) {
    const next: Buffer[] = [];

    // Duplicate last if odd
    if (level.length % 2 !== 0) {
      level.push(Buffer.from(level[level.length - 1]));
    }

    for (let i = 0; i < level.length; i += 2) {
      next.push(sha256d(Buffer.concat([level[i], level[i + 1]])));
    }

    level = next;
  }

  return level[0];
}
