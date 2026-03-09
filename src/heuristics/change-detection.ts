/**
 * Change Detection Heuristic.
 *
 * Identifies the likely change output in a transaction using multiple methods:
 *
 * 1. Script type matching: change output typically matches the input script type
 * 2. Round number analysis: payment amounts tend to be round, change is not
 * 3. Output position: Bitcoin Core randomizes change position (index 0 or 1),
 *    so position alone is weak but combined with other signals adds confidence
 * 4. Value analysis: change is the "leftover" and tends to be non-round
 *
 * Confidence levels:
 * - "high": single unambiguous match via script type + round number agreement
 * - "medium": script type match but multiple candidates or all same type
 * - "low": only round number or position heuristic, no script type signal
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import { isRoundAmount, dominantScriptType } from "./utils.js";

export interface ChangeDetectionResult extends HeuristicResult {
  detected: boolean;
  likely_change_index?: number;
  method?: string;
  confidence?: "high" | "medium" | "low";
}

function analyze(ctx: TransactionContext): ChangeDetectionResult {
  if (ctx.isCoinbase || ctx.tx.outputs.length < 2) {
    return { detected: false };
  }

  const inputType = dominantScriptType(ctx.inputScriptTypes);

  const scriptMatches: number[] = [];
  for (let i = 0; i < ctx.outputScriptTypes.length; i++) {
    if (ctx.outputScriptTypes[i] === inputType && ctx.outputScriptTypes[i] !== "op_return") {
      scriptMatches.push(i);
    }
  }

  const nonRoundIndices: number[] = [];
  for (let i = 0; i < ctx.outputValues.length; i++) {
    if (ctx.outputScriptTypes[i] === "op_return") continue;
    if (!isRoundAmount(ctx.outputValues[i]) && ctx.outputValues[i] > 0) {
      nonRoundIndices.push(i);
    }
  }

  // Strategy 1: Single script type match among differently-typed outputs
  if (scriptMatches.length === 1) {
    const allSameType = ctx.outputScriptTypes.every(
      t => t === "op_return" || t === ctx.outputScriptTypes[0]
    );
    return {
      detected: true,
      likely_change_index: scriptMatches[0],
      method: "script_type_match",
      confidence: allSameType ? "medium" : "high",
    };
  }

  // Strategy 2: Script type match + round number analysis
  if (scriptMatches.length > 1) {
    const nonRoundScriptMatches = scriptMatches.filter(i => !isRoundAmount(ctx.outputValues[i]));

    if (nonRoundScriptMatches.length === 1) {
      return {
        detected: true,
        likely_change_index: nonRoundScriptMatches[0],
        method: "script_type_and_round_number",
        confidence: "high",
      };
    }

    if (nonRoundScriptMatches.length > 1) {
      return {
        detected: true,
        likely_change_index: nonRoundScriptMatches[0],
        method: "script_type_match",
        confidence: "medium",
      };
    }

    return {
      detected: true,
      likely_change_index: scriptMatches[0],
      method: "script_type_match",
      confidence: "medium",
    };
  }

  // Strategy 3: Round number only — the non-round output is likely change
  if (nonRoundIndices.length === 1) {
    return {
      detected: true,
      likely_change_index: nonRoundIndices[0],
      method: "round_number_analysis",
      confidence: "low",
    };
  }

  // Strategy 4: Output position heuristic for 2-output transactions
  // When no other signal is available, the smaller output in a 2-output
  // tx is more likely the payment (users think in round-ish amounts).
  const realOutputs = ctx.outputValues
    .map((v, i) => ({ index: i, value: v, type: ctx.outputScriptTypes[i] }))
    .filter(o => o.type !== "op_return" && o.value > 0);

  if (realOutputs.length === 2) {
    const [a, b] = realOutputs;
    const largerIdx = a.value >= b.value ? a.index : b.index;
    return {
      detected: true,
      likely_change_index: largerIdx,
      method: "output_value_analysis",
      confidence: "low",
    };
  }

  return { detected: false };
}

export const changeDetection: Heuristic = { id: "change_detection", analyze };
