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

    const sorted = [...utxos].sort((a, b) => b.value_sats - a.value_sats);
    const available = sorted.slice(0, limit);

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

      for (let i = index; i < available.length; i++) {
        if (selected.length >= limit) break;
        selected.push(available[i]);
        search(i + 1, selected, currentSum + available[i].value_sats);
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
