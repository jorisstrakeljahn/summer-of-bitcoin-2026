/**
 * Multi-strategy coin selection.
 *
 * Runs all available strategies and picks the result with the lowest
 * fee. This approach combines the strengths of different algorithms:
 *
 *   Branch-and-Bound — Finds exact-match input sets that avoid creating
 *                      a change output entirely (lowest waste).
 *   Lowest-Fee       — Greedy by value-per-vbyte efficiency, preferring
 *                      inputs that cost the least in fees to spend.
 *   Largest-First    — Greedy by value, reliable fallback that minimizes
 *                      the number of inputs needed.
 *
 * If no strategy finds a valid selection, throws InsufficientFundsError.
 */

import type { CoinSelectionParams } from "./types";
import type { CoinSelectionResult } from "../types";
import { largestFirst } from "./largest-first";
import { branchAndBound } from "./branch-and-bound";
import { lowestFee } from "./lowest-fee";
import { InsufficientFundsError } from "../fee-calculator";

const STRATEGIES = [branchAndBound, lowestFee, largestFirst];

export function selectCoins(params: CoinSelectionParams): CoinSelectionResult {
  const results: CoinSelectionResult[] = [];

  for (const strategy of STRATEGIES) {
    const result = strategy.select(params);
    if (result) results.push(result);
  }

  if (results.length === 0) {
    const available = params.utxos.reduce((s, u) => s + u.value_sats, 0);
    const needed = params.payments.reduce((s, p) => s + p.value_sats, 0);
    throw new InsufficientFundsError(available, needed, 0);
  }

  results.sort((a, b) => a.fee - b.fee);
  return results[0];
}

/** Returns results from all strategies that found a valid selection. */
export function selectCoinsAllStrategies(
  params: CoinSelectionParams,
): CoinSelectionResult[] {
  const results: CoinSelectionResult[] = [];

  for (const strategy of STRATEGIES) {
    const result = strategy.select(params);
    if (result) results.push(result);
  }

  return results.sort((a, b) => a.fee - b.fee);
}
