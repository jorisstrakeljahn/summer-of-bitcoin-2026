/**
 * Shared utilities for chain analysis heuristics.
 */

import type { OutputScriptType } from "../lib/types.js";

const ROUND_THRESHOLDS = [
  100_000_000,  // 1 BTC
  10_000_000,   // 0.1 BTC
  1_000_000,    // 0.01 BTC
  100_000,      // 0.001 BTC
  10_000,       // 0.0001 BTC
];

export function isRoundAmount(sats: number): boolean {
  return ROUND_THRESHOLDS.some(t => sats > 0 && sats % t === 0);
}

export function dominantScriptType(types: OutputScriptType[]): OutputScriptType | null {
  if (types.length === 0) return null;

  const counts = new Map<OutputScriptType, number>();
  for (const t of types) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  let best: OutputScriptType | null = null;
  let bestCount = 0;
  for (const [type, count] of counts) {
    if (count > bestCount) {
      best = type;
      bestCount = count;
    }
  }
  return best;
}
