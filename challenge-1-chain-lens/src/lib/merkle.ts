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

  let level: Buffer[] = [...txids];
  const pair = Buffer.alloc(64);

  while (level.length > 1) {
    const next: Buffer[] = [];

    if (level.length % 2 !== 0) {
      level.push(level[level.length - 1]);
    }

    for (let i = 0; i < level.length; i += 2) {
      level[i].copy(pair, 0);
      level[i + 1].copy(pair, 32);
      next.push(sha256d(pair));
    }

    level = next;
  }

  return level[0];
}
