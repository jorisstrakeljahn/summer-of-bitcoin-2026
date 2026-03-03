import type { CoinSelectionParams } from "./types.js";
import type { CoinSelectionResult } from "../types.js";
import { largestFirst } from "./largest-first.js";

const strategies = [largestFirst];

export function selectCoins(params: CoinSelectionParams): CoinSelectionResult {
  const results: CoinSelectionResult[] = [];

  for (const strategy of strategies) {
    const result = strategy.select(params);
    if (result) results.push(result);
  }

  if (results.length === 0) {
    throw new Error("No coin selection strategy found a valid solution");
  }

  results.sort((a, b) => a.fee - b.fee);
  return results[0];
}

export function selectCoinsAllStrategies(
  params: CoinSelectionParams,
): CoinSelectionResult[] {
  const results: CoinSelectionResult[] = [];

  for (const strategy of strategies) {
    const result = strategy.select(params);
    if (result) results.push(result);
  }

  return results.sort((a, b) => a.fee - b.fee);
}
