import type { CoinSelectionParams } from "./types";
import type { CoinSelectionResult } from "../types";
import { largestFirst } from "./largest-first";
import { InsufficientFundsError } from "../fee-calculator";

const strategies = [largestFirst];

export function selectCoins(params: CoinSelectionParams): CoinSelectionResult {
  const results: CoinSelectionResult[] = [];

  for (const strategy of strategies) {
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
