/**
 * CoinJoin Detection Heuristic.
 *
 * CoinJoin transactions mix inputs from multiple users with equal-value
 * outputs to obscure the transaction graph. Detection signals:
 *
 * - Multiple inputs (typically ≥3)
 * - Multiple outputs with identical values (the "equal output" set)
 * - The equal output count should be ≥2 and represent a significant
 *   portion of non-change outputs
 *
 * This heuristic identifies likely CoinJoin patterns but cannot
 * distinguish from other transactions with coincidentally equal outputs.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";

export interface CoinjoinResult extends HeuristicResult {
  detected: boolean;
  equal_output_count?: number;
  equal_output_value?: number;
}

const MIN_INPUTS = 3;
const MIN_EQUAL_OUTPUTS = 3;

function analyze(ctx: TransactionContext): CoinjoinResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  if (ctx.tx.inputs.length < MIN_INPUTS) {
    return { detected: false };
  }

  // Count output values, ignoring OP_RETURN (value 0) outputs
  const valueCounts = new Map<number, number>();
  for (let i = 0; i < ctx.outputValues.length; i++) {
    const val = ctx.outputValues[i];
    if (ctx.outputScriptTypes[i] === "op_return" || val === 0) continue;
    valueCounts.set(val, (valueCounts.get(val) ?? 0) + 1);
  }

  // Find the most common output value with ≥ MIN_EQUAL_OUTPUTS occurrences
  let bestValue = 0;
  let bestCount = 0;
  for (const [val, count] of valueCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestValue = val;
    }
  }

  if (bestCount < MIN_EQUAL_OUTPUTS) {
    return { detected: false };
  }

  return {
    detected: true,
    equal_output_count: bestCount,
    equal_output_value: bestValue,
  };
}

export const coinjoin: Heuristic = { id: "coinjoin", analyze };
