/**
 * Self-Transfer Detection Heuristic.
 *
 * Identifies transactions where all inputs and outputs likely belong
 * to the same entity. Signals:
 *
 * - All non-OP_RETURN outputs match the dominant input script type
 * - 1-2 outputs (no batch payment pattern)
 * - No round-number outputs suggesting external payments
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import type { OutputScriptType } from "../lib/types.js";

export interface SelfTransferResult extends HeuristicResult {
  detected: boolean;
}

const ROUND_THRESHOLDS = [
  100_000_000,
  10_000_000,
  1_000_000,
];

function isRoundAmount(sats: number): boolean {
  return ROUND_THRESHOLDS.some(t => sats > 0 && sats % t === 0);
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

  // Find dominant input type
  const inputTypeCounts = new Map<OutputScriptType, number>();
  for (const t of ctx.inputScriptTypes) {
    inputTypeCounts.set(t, (inputTypeCounts.get(t) ?? 0) + 1);
  }
  let dominantType: OutputScriptType = ctx.inputScriptTypes[0];
  let maxCount = 0;
  for (const [t, c] of inputTypeCounts) {
    if (c > maxCount) { dominantType = t; maxCount = c; }
  }

  // All real outputs must match the dominant input type
  const allMatch = realOutputTypes.every(t => t === dominantType);
  if (!allMatch) {
    return { detected: false };
  }

  // If any output is a round amount, it looks more like a payment
  const hasRound = realOutputValues.some(v => isRoundAmount(v));
  if (hasRound) {
    return { detected: false };
  }

  return { detected: true };
}

export const selfTransfer: Heuristic = { id: "self_transfer", analyze };
