/**
 * Branch-and-Bound coin selection.
 *
 * Searches for an input combination that exactly covers payments + fee
 * without creating a change output. Inspired by Bitcoin Core's
 * implementation (see: src/wallet/coinselection.cpp).
 *
 * The algorithm performs a depth-first search over UTXO subsets,
 * pruning branches that exceed a "waste" threshold (excess sats that
 * would be absorbed as fee). Exploration is capped at MAX_TRIES to
 * bound runtime on large UTXO pools.
 *
 * Trade-offs:
 *   + Eliminates change output (~31 vB saved, better privacy)
 *   + Optimal when an exact or near-exact match exists
 *   − Exponential worst-case (mitigated by MAX_TRIES cap)
 *   − Returns null when no suitable match is found (needs fallback)
 */

import type { CoinSelectionStrategy, CoinSelectionParams } from "./types";
import type { CoinSelectionResult, Utxo } from "../types";
import { estimateVbytes } from "../vbytes";

const MAX_TRIES = 100_000;

export const branchAndBound: CoinSelectionStrategy = {
  name: "branch_and_bound",

  select(params: CoinSelectionParams): CoinSelectionResult | null {
    const { utxos, payments, feeRate, maxInputs } = params;
    const paymentSum = payments.reduce((s, p) => s + p.value_sats, 0);
    const limit = maxInputs ?? utxos.length;

    const candidates = [...utxos]
      .sort((a, b) => b.value_sats - a.value_sats)
      .slice(0, limit);

    let bestMatch: Utxo[] | null = null;
    let bestWaste = Infinity;
    let tries = 0;

    function search(index: number, selected: Utxo[], currentSum: number): void {
      if (tries++ > MAX_TRIES) return;

      if (currentSum >= paymentSum) {
        const vbytes = estimateVbytes(selected, payments, null);
        const fee = Math.ceil(vbytes * feeRate);
        const waste = currentSum - paymentSum - fee;

        if (waste >= 0 && waste < bestWaste) {
          bestWaste = waste;
          bestMatch = [...selected];
        }
        if (waste <= 0) return;
      }

      for (let i = index; i < candidates.length; i++) {
        if (selected.length >= limit) break;
        selected.push(candidates[i]);
        search(i + 1, selected, currentSum + candidates[i].value_sats);
        selected.pop();
      }
    }

    search(0, [], 0);

    if (!bestMatch) return null;

    const matched: Utxo[] = bestMatch;
    const vbytes = estimateVbytes(matched, payments, null);
    const fee = Math.ceil(vbytes * feeRate);
    const leftover = matched.reduce((s, u) => s + u.value_sats, 0) - paymentSum;

    if (leftover < fee) return null;

    return {
      selectedUtxos: matched,
      fee: leftover,
      changeAmount: null,
      vbytes,
      strategyName: this.name,
    };
  },
};
