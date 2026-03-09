/**
 * Peeling Chain Detection Heuristic.
 *
 * A peeling chain pattern occurs when a large UTXO is repeatedly split:
 * one small output (payment) and one large output (change), where the
 * large output is then spent in the next transaction following the same
 * pattern.
 *
 * Within a single transaction, we detect the structural pattern:
 * - Exactly 1 input (or few inputs)
 * - Exactly 2 non-OP_RETURN outputs
 * - One output is significantly larger than the other
 * - The larger output matches the input script type (likely change)
 *
 * Cross-transaction peeling chain linking requires a transaction graph
 * which is out of scope for single-block analysis.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";

export interface PeelingChainResult extends HeuristicResult {
  detected: boolean;
}

const SIZE_RATIO_THRESHOLD = 10;

function analyze(ctx: TransactionContext): PeelingChainResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  // Peeling chains typically have 1 input (spending the previous "peel")
  if (ctx.tx.inputs.length > 2) {
    return { detected: false };
  }

  const realOutputs: { index: number; value: number; type: string }[] = [];
  for (let i = 0; i < ctx.outputValues.length; i++) {
    if (ctx.outputScriptTypes[i] === "op_return") continue;
    realOutputs.push({ index: i, value: ctx.outputValues[i], type: ctx.outputScriptTypes[i] });
  }

  if (realOutputs.length !== 2) {
    return { detected: false };
  }

  const [a, b] = realOutputs;
  if (a.value === 0 || b.value === 0) {
    return { detected: false };
  }

  const ratio = a.value > b.value ? a.value / b.value : b.value / a.value;
  if (ratio < SIZE_RATIO_THRESHOLD) {
    return { detected: false };
  }

  // The larger output should match the dominant input script type
  const larger = a.value > b.value ? a : b;
  const dominantInputType = ctx.inputScriptTypes[0];

  if (larger.type !== dominantInputType) {
    return { detected: false };
  }

  return { detected: true };
}

export const peelingChain: Heuristic = { id: "peeling_chain", analyze };
