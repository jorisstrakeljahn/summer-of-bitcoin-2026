/**
 * Prevout matching — links transaction inputs to their spent outputs.
 *
 * Prevouts from the fixture are NOT necessarily in the same order as inputs.
 * Matching is done by (txid, vout) key lookup.
 *
 * Errors on:
 *  - Missing prevout for an input
 *  - Duplicate prevouts (same txid:vout appearing twice)
 *  - Unused prevouts (provided but not referenced by any input)
 */

import type { ParsedInput, FixturePrevout } from "./types.js";

export interface MatchedPrevout {
  value_sats: number;
  script_pubkey_hex: string;
}

/** Creates a unique key for prevout lookup. */
function prevoutKey(txid: string, vout: number): string {
  return `${txid}:${vout}`;
}

/**
 * Match fixture prevouts to parsed transaction inputs.
 *
 * Returns an array aligned with the input array — matchedPrevouts[i]
 * corresponds to inputs[i].
 *
 * @throws Error if any prevout is missing, duplicated, or unused
 */
export function matchPrevouts(
  inputs: ParsedInput[],
  prevouts: FixturePrevout[],
): MatchedPrevout[] {
  const lookup = buildPrevoutLookup(prevouts);
  const matched = resolveInputPrevouts(inputs, lookup);
  assertNoUnusedPrevouts(lookup);
  return matched;
}

function buildPrevoutLookup(prevouts: FixturePrevout[]): Map<string, FixturePrevout> {
  const map = new Map<string, FixturePrevout>();

  for (const prevout of prevouts) {
    const key = prevoutKey(prevout.txid, prevout.vout);
    if (map.has(key)) {
      throw new Error(`Duplicate prevout: ${key}`);
    }
    map.set(key, prevout);
  }

  return map;
}

function resolveInputPrevouts(
  inputs: ParsedInput[],
  lookup: Map<string, FixturePrevout>,
): MatchedPrevout[] {
  return inputs.map((input, i) => {
    const key = prevoutKey(input.txid, input.vout);
    const prevout = lookup.get(key);

    if (!prevout) {
      throw new Error(`Missing prevout for input ${i}: ${key}`);
    }

    // Mark as used by removing from the map
    lookup.delete(key);

    return {
      value_sats: prevout.value_sats,
      script_pubkey_hex: prevout.script_pubkey_hex,
    };
  });
}

function assertNoUnusedPrevouts(lookup: Map<string, FixturePrevout>): void {
  if (lookup.size > 0) {
    const unused = [...lookup.keys()].join(", ");
    throw new Error(`Unused prevouts not referenced by any input: ${unused}`);
  }
}
