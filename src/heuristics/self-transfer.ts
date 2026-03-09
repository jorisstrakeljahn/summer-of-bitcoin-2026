/**
 * Self-Transfer Detection Heuristic.
 *
 * Identifies transactions where all inputs and outputs likely belong
 * to the same entity. Signals:
 *
 * - All non-OP_RETURN outputs match the dominant input script type
 * - 1-2 outputs (no batch payment pattern)
 * - No round-number outputs suggesting external payments
 * - Total output value is close to total input value (high fee ratio
 *   would be unusual for a self-transfer)
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import { isRoundAmount, dominantScriptType } from "./utils.js";

export interface SelfTransferResult extends HeuristicResult {
  detected: boolean;
}

function analyze(ctx: TransactionContext): SelfTransferResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const realOutputTypes = ctx.outputScriptTypes.filter(t => t !== "op_return");
  const realOutputValues = ctx.outputValues.filter(
    (_, i) => ctx.outputScriptTypes[i] !== "op_return"
  );

  if (realOutputTypes.length === 0 || realOutputTypes.length > 2) {
    return { detected: false };
  }

  const dominant = dominantScriptType(ctx.inputScriptTypes);
  if (!dominant) {
    return { detected: false };
  }

  if (!realOutputTypes.every(t => t === dominant)) {
    return { detected: false };
  }

  if (realOutputValues.some(v => isRoundAmount(v))) {
    return { detected: false };
  }

  // Fee sanity check: self-transfers don't typically overpay fees.
  // If fee is more than 5% of total input, it's suspicious.
  const totalIn = ctx.inputValues.reduce((s, v) => s + v, 0);
  if (totalIn > 0 && ctx.fee / totalIn > 0.05) {
    return { detected: false };
  }

  return { detected: true };
}

export const selfTransfer: Heuristic = { id: "self_transfer", analyze };
