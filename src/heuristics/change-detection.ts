/**
 * Change Detection Heuristic.
 *
 * Identifies the likely change output in a transaction using multiple methods:
 *
 * 1. Script type matching: change output typically matches the input script type
 * 2. Round number analysis: payment amounts tend to be round, change is not
 * 3. Single-match: if exactly one output matches the input script type while
 *    others don't, that output is very likely change
 *
 * Confidence levels:
 * - "high": single unambiguous match via script type + round number agreement
 * - "medium": script type match but multiple candidates
 * - "low": only round number heuristic, no script type signal
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import type { OutputScriptType } from "../lib/types.js";

export interface ChangeDetectionResult extends HeuristicResult {
  detected: boolean;
  likely_change_index?: number;
  method?: string;
  confidence?: "high" | "medium" | "low";
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

function dominantInputType(types: OutputScriptType[]): OutputScriptType | null {
  const counts = new Map<OutputScriptType, number>();
  for (const t of types) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  let best: OutputScriptType | null = null;
  let bestCount = 0;
  for (const [type, count] of counts) {
    if (count > bestCount) {
      best = type;
      bestCount = count;
    }
  }
  return best;
}

function analyze(ctx: TransactionContext): ChangeDetectionResult {
  if (ctx.isCoinbase || ctx.tx.outputs.length < 2) {
    return { detected: false };
  }

  const inputType = dominantInputType(ctx.inputScriptTypes);

  // Find outputs matching the dominant input script type (excluding op_return)
  const scriptMatches: number[] = [];
  for (let i = 0; i < ctx.outputScriptTypes.length; i++) {
    if (ctx.outputScriptTypes[i] === inputType && ctx.outputScriptTypes[i] !== "op_return") {
      scriptMatches.push(i);
    }
  }

  // Find non-round outputs (candidates for change by round number heuristic)
  const nonRoundIndices: number[] = [];
  for (let i = 0; i < ctx.outputValues.length; i++) {
    if (ctx.outputScriptTypes[i] === "op_return") continue;
    if (!isRoundAmount(ctx.outputValues[i]) && ctx.outputValues[i] > 0) {
      nonRoundIndices.push(i);
    }
  }

  // Strategy 1: Single script type match among differently-typed outputs
  if (scriptMatches.length === 1) {
    const idx = scriptMatches[0];
    const allSameType = ctx.outputScriptTypes.every(
      (t, i) => t === "op_return" || t === ctx.outputScriptTypes[0]
    );
    const confidence = allSameType ? "medium" : "high";

    return {
      detected: true,
      likely_change_index: idx,
      method: "script_type_match",
      confidence,
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

    // Multiple script matches, pick the one with the smallest non-round value
    // (change tends to be the "leftover" amount)
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

  // Strategy 3: No script type signal, fall back to round number only
  if (nonRoundIndices.length === 1) {
    return {
      detected: true,
      likely_change_index: nonRoundIndices[0],
      method: "round_number_analysis",
      confidence: "low",
    };
  }

  return { detected: false };
}

export const changeDetection: Heuristic = { id: "change_detection", analyze };
