import type { CoinSelectionStrategy, CoinSelectionParams } from "./types";
import type { CoinSelectionResult } from "../types";
import { inputVbytes } from "../vbytes";
import { calculateFeeAndChange, InsufficientFundsError } from "../fee-calculator";

export const lowestFee: CoinSelectionStrategy = {
  name: "lowest_fee",

  select(params: CoinSelectionParams): CoinSelectionResult | null {
    const { utxos, payments, change, feeRate, maxInputs } = params;
    const paymentSum = payments.reduce((s, p) => s + p.value_sats, 0);

    const sorted = [...utxos].sort((a, b) => {
      const effA = a.value_sats / inputVbytes(a.script_type);
      const effB = b.value_sats / inputVbytes(b.script_type);
      return effB - effA;
    });

    const limit = maxInputs ?? sorted.length;
    const selected = [];
    let inputSum = 0;

    for (const utxo of sorted) {
      if (selected.length >= limit) break;
      selected.push(utxo);
      inputSum += utxo.value_sats;

      if (inputSum <= paymentSum) continue;

      try {
        const result = calculateFeeAndChange(selected, payments, change, feeRate);
        return {
          selectedUtxos: selected,
          fee: result.fee,
          changeAmount: result.changeAmount,
          vbytes: result.vbytes,
          strategyName: this.name,
        };
      } catch (e) {
        if (e instanceof InsufficientFundsError) continue;
        throw e;
      }
    }

    return null;
  },
};
