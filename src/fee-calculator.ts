/**
 * Two-pass fee and change calculation.
 *
 * Determines the transaction fee and whether to include a change output.
 * A two-pass approach is necessary because adding/removing a change
 * output changes the transaction size, which changes the required fee —
 * a circular dependency that single-pass implementations get wrong at
 * boundary conditions.
 *
 * Algorithm:
 *   Pass 1: Estimate fee WITH a change output.
 *           change = inputs − payments − ⌈vbytes_with_change × rate⌉
 *           If change ≥ DUST_THRESHOLD → create change, done.
 *
 *   Pass 2: Fall back to send-all (no change output).
 *           fee = ⌈vbytes_without_change × rate⌉
 *           If leftover ≥ fee → absorb everything as fee, done.
 *
 *   Otherwise → insufficient funds.
 */

import type { Utxo, Payment, ChangeTemplate, FeeChangeResult } from "./types";
import { estimateVbytes } from "./vbytes";
import { DUST_THRESHOLD_SATS } from "./constants";

export function calculateFeeAndChange(
  selectedInputs: Utxo[],
  payments: Payment[],
  change: ChangeTemplate,
  feeRate: number,
): FeeChangeResult {
  const inputSum = selectedInputs.reduce((s, u) => s + u.value_sats, 0);
  const paymentSum = payments.reduce((s, p) => s + p.value_sats, 0);

  // Pass 1: try with change output
  const vbytesWithChange = estimateVbytes(selectedInputs, payments, change);
  const feeWithChange = Math.ceil(vbytesWithChange * feeRate);
  const changeAmount = inputSum - paymentSum - feeWithChange;

  if (changeAmount >= DUST_THRESHOLD_SATS) {
    return { fee: feeWithChange, changeAmount, vbytes: vbytesWithChange };
  }

  // Pass 2: send-all (no change output, leftover becomes fee)
  const vbytesNoChange = estimateVbytes(selectedInputs, payments, null);
  const feeNoChange = Math.ceil(vbytesNoChange * feeRate);
  const leftover = inputSum - paymentSum;

  if (leftover >= feeNoChange) {
    return { fee: leftover, changeAmount: null, vbytes: vbytesNoChange };
  }

  throw new InsufficientFundsError(inputSum, paymentSum, feeNoChange);
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
