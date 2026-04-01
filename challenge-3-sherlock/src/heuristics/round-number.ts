/**
 * Round Number Payment Heuristic.
 *
 * Identifies outputs with values that are round BTC amounts (e.g., 0.1 BTC,
 * 0.01 BTC, 1 BTC). Round-number outputs are more likely to be payments;
 * non-round outputs are more likely to be change.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import { isRoundAmount } from "./utils.js";

export interface RoundNumberResult extends HeuristicResult {
  detected: boolean;
  round_outputs?: number[];
}

function analyze(ctx: TransactionContext): RoundNumberResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const roundIndices: number[] = [];
  for (let i = 0; i < ctx.outputValues.length; i++) {
    if (ctx.outputScriptTypes[i] === "op_return") continue;
    if (isRoundAmount(ctx.outputValues[i])) {
      roundIndices.push(i);
    }
  }

  if (roundIndices.length === 0) {
    return { detected: false };
  }

  return {
    detected: true,
    round_outputs: roundIndices,
  };
}

export const roundNumber: Heuristic = { id: "round_number_payment", analyze };
