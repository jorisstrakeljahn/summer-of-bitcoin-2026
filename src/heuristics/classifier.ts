/**
 * Transaction classifier.
 *
 * Assigns one of the defined classifications to a transaction based on
 * the combined heuristic results. Priority order:
 *
 * 1. coinjoin (strongest signal — multi-party mixing)
 * 2. consolidation (many inputs → few outputs, wallet maintenance)
 * 3. self_transfer (all outputs match input type, no payment signals)
 * 4. batch_payment (1 input type → many different output addresses)
 * 5. simple_payment (default for standard 1-in/2-out transactions)
 * 6. unknown (coinbase or unclassifiable)
 */

import type { TransactionClassification, HeuristicResult, TransactionContext } from "./types.js";

export function classifyTransaction(
  ctx: TransactionContext,
  results: Record<string, HeuristicResult>,
): TransactionClassification {
  if (ctx.isCoinbase) {
    return "unknown";
  }

  if (results.coinjoin?.detected) {
    return "coinjoin";
  }

  if (results.consolidation?.detected) {
    return "consolidation";
  }

  if (results.self_transfer?.detected) {
    return "self_transfer";
  }

  // Batch payment: many outputs (≥3 non-OP_RETURN) with a single input type
  const realOutputCount = ctx.outputScriptTypes.filter(t => t !== "op_return").length;
  if (realOutputCount >= 3 && !results.coinjoin?.detected) {
    return "batch_payment";
  }

  // Simple payment: standard structure (1-2 inputs, 1-2 outputs)
  if (realOutputCount <= 2) {
    return "simple_payment";
  }

  return "unknown";
}
