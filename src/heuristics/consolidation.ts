/**
 * Consolidation Detection Heuristic.
 *
 * Consolidation transactions combine many UTXOs into fewer outputs,
 * reducing the UTXO set size. Common wallet maintenance pattern.
 *
 * Signals:
 * - Many inputs (≥3)
 * - Few outputs (1-2, excluding OP_RETURN)
 * - Outputs match the dominant input script type (same wallet)
 * - No round-number outputs (consolidation is not a payment)
 *
 * Distinguishes from batch payments and CoinJoin by requiring output
 * script type consistency with inputs and low output count.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import { dominantScriptType, isRoundAmount } from "./utils.js";

export interface ConsolidationResult extends HeuristicResult {
  detected: boolean;
  input_count?: number;
  output_count?: number;
}

const MIN_INPUTS = 3;
const MAX_OUTPUTS = 2;

function analyze(ctx: TransactionContext): ConsolidationResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const realOutputs = ctx.outputScriptTypes
    .map((t, i) => ({ type: t, value: ctx.outputValues[i] }))
    .filter(o => o.type !== "op_return");

  if (ctx.tx.inputs.length < MIN_INPUTS || realOutputs.length > MAX_OUTPUTS) {
    return { detected: false };
  }

  // Script type consistency: outputs should match the dominant input type
  const dominant = dominantScriptType(ctx.inputScriptTypes);
  if (dominant) {
    const outputsMatchInput = realOutputs.every(o => o.type === dominant);
    if (!outputsMatchInput) {
      return { detected: false };
    }
  }

  // Round number check: consolidation rarely has round-number outputs
  const hasRound = realOutputs.some(o => isRoundAmount(o.value));
  if (hasRound) {
    return { detected: false };
  }

  return {
    detected: true,
    input_count: ctx.tx.inputs.length,
    output_count: realOutputs.length,
  };
}

export const consolidation: Heuristic = { id: "consolidation", analyze };
