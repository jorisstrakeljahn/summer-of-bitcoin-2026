/**
 * CoinJoin Detection Heuristic.
 *
 * CoinJoin transactions mix inputs from multiple users with equal-value
 * outputs to obscure the transaction graph. This implementation detects
 * multiple patterns:
 *
 * 1. Classic CoinJoin: ≥3 inputs, ≥3 equal-value outputs
 * 2. Whirlpool-style: equal input count and output count, all outputs
 *    have the same value (pool denomination)
 * 3. PayJoin-style: 2 inputs, 2 outputs with one equal-value pair
 *    (relaxed detection, marked as "possible")
 *
 * Reports the dominant equal output value and count, plus a sub_type
 * hint when a specific protocol pattern is matched.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";

export interface CoinjoinResult extends HeuristicResult {
  detected: boolean;
  equal_output_count?: number;
  equal_output_value?: number;
  sub_type?: "classic" | "whirlpool" | "possible_payjoin";
}

const MIN_INPUTS_CLASSIC = 3;
const MIN_EQUAL_OUTPUTS_CLASSIC = 3;

function analyze(ctx: TransactionContext): CoinjoinResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const realOutputValues: number[] = [];
  for (let i = 0; i < ctx.outputValues.length; i++) {
    if (ctx.outputScriptTypes[i] === "op_return" || ctx.outputValues[i] === 0) continue;
    realOutputValues.push(ctx.outputValues[i]);
  }

  const valueCounts = new Map<number, number>();
  for (const val of realOutputValues) {
    valueCounts.set(val, (valueCounts.get(val) ?? 0) + 1);
  }

  let bestValue = 0;
  let bestCount = 0;
  for (const [val, count] of valueCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestValue = val;
    }
  }

  // Whirlpool detection: all real outputs have the same value and
  // the number of outputs equals the number of inputs (pool round)
  if (
    bestCount >= MIN_EQUAL_OUTPUTS_CLASSIC &&
    bestCount === realOutputValues.length &&
    bestCount === ctx.tx.inputs.length
  ) {
    return {
      detected: true,
      equal_output_count: bestCount,
      equal_output_value: bestValue,
      sub_type: "whirlpool",
    };
  }

  // Classic CoinJoin: ≥3 inputs, ≥3 equal outputs
  if (ctx.tx.inputs.length >= MIN_INPUTS_CLASSIC && bestCount >= MIN_EQUAL_OUTPUTS_CLASSIC) {
    return {
      detected: true,
      equal_output_count: bestCount,
      equal_output_value: bestValue,
      sub_type: "classic",
    };
  }

  // Possible PayJoin: exactly 2 inputs, 2 outputs, diverse input addresses
  // (one output matches an input address — but we can't check addresses here,
  // so we just flag the structural pattern)
  if (
    ctx.tx.inputs.length === 2 &&
    realOutputValues.length === 2 &&
    bestCount === 2
  ) {
    return {
      detected: true,
      equal_output_count: bestCount,
      equal_output_value: bestValue,
      sub_type: "possible_payjoin",
    };
  }

  return { detected: false };
}

export const coinjoin: Heuristic = { id: "coinjoin", analyze };
