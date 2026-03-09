/**
 * Common Input Ownership Heuristic (CIOH).
 *
 * Foundational chain analysis assumption: if multiple inputs are spent
 * together in a single transaction, they are probably controlled by the
 * same wallet/entity. Flag any transaction with more than one input.
 *
 * Coinbase transactions are excluded (single null input, not a real UTXO).
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";

export interface CiohResult extends HeuristicResult {
  detected: boolean;
  input_count?: number;
}

function analyze(ctx: TransactionContext): CiohResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const detected = ctx.tx.inputs.length > 1;

  return {
    detected,
    ...(detected ? { input_count: ctx.tx.inputs.length } : {}),
  };
}

export const cioh: Heuristic = { id: "cioh", analyze };
