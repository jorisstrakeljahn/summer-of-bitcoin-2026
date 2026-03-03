import type { Utxo, Payment, ChangeTemplate, FeeChangeResult } from "./types";
import { estimateVbytes } from "./vbytes";

const DUST_THRESHOLD = 546;

export function calculateFeeAndChange(
  selectedInputs: Utxo[],
  payments: Payment[],
  change: ChangeTemplate,
  feeRate: number,
): FeeChangeResult {
  const inputSum = selectedInputs.reduce((s, u) => s + u.value_sats, 0);
  const paymentSum = payments.reduce((s, p) => s + p.value_sats, 0);

  const vbytesWithChange = estimateVbytes(selectedInputs, payments, change);
  const feeWithChange = Math.ceil(vbytesWithChange * feeRate);
  const changeAmount = inputSum - paymentSum - feeWithChange;

  if (changeAmount >= DUST_THRESHOLD) {
    return {
      fee: feeWithChange,
      changeAmount,
      vbytes: vbytesWithChange,
    };
  }

  const vbytesWithoutChange = estimateVbytes(selectedInputs, payments, null);
  const feeWithoutChange = Math.ceil(vbytesWithoutChange * feeRate);
  const leftover = inputSum - paymentSum;

  if (leftover >= feeWithoutChange) {
    return {
      fee: leftover,
      changeAmount: null,
      vbytes: vbytesWithoutChange,
    };
  }

  throw new InsufficientFundsError(inputSum, paymentSum, feeWithoutChange);
}

export class InsufficientFundsError extends Error {
  public readonly code = "INSUFFICIENT_FUNDS";

  constructor(
    public readonly available: number,
    public readonly needed: number,
    public readonly minFee: number,
  ) {
    super(
      `Insufficient funds: have ${available} sats, need ${needed} + ${minFee} fee = ${needed + minFee} sats`,
    );
    this.name = "InsufficientFundsError";
  }
}
