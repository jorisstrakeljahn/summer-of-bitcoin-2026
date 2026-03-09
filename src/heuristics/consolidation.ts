/**
 * Consolidation Detection Heuristic.
 *
 * Consolidation transactions combine many UTXOs into fewer outputs,
 * reducing the UTXO set size. Common wallet maintenance pattern.
 *
 * Signals:
 * - Many inputs (≥3)
 * - Few outputs (1-2)
 * - Outputs typically match the input script type
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";

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

  const realOutputCount = ctx.outputScriptTypes.filter(t => t !== "op_return").length;

  if (ctx.tx.inputs.length < MIN_INPUTS || realOutputCount > MAX_OUTPUTS) {
    return { detected: false };
  }

  return {
    detected: true,
    input_count: ctx.tx.inputs.length,
    output_count: realOutputCount,
  };
}

export const consolidation: Heuristic = { id: "consolidation", analyze };
