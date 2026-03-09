/**
 * Round Number Payment Heuristic.
 *
 * Identifies outputs with values that are round BTC amounts (e.g., 0.1 BTC,
 * 0.01 BTC, 1 BTC). Round-number outputs are more likely to be payments;
 * non-round outputs are more likely to be change.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";

export interface RoundNumberResult extends HeuristicResult {
  detected: boolean;
  round_outputs?: number[];
}

const ROUND_THRESHOLDS = [
  100_000_000,  // 1 BTC
  10_000_000,   // 0.1 BTC
  1_000_000,    // 0.01 BTC
  100_000,      // 0.001 BTC
  10_000,       // 0.0001 BTC
];

function isRoundAmount(sats: number): boolean {
  return ROUND_THRESHOLDS.some(t => sats > 0 && sats % t === 0);
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
