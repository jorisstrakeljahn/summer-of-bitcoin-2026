/**
 * Statistical aggregation for chain analysis reports.
 *
 * Computes fee rate statistics and script type distribution from
 * per-transaction analysis results.
 */

import type { OutputScriptType } from "./lib/types.js";

export interface FeeRateStats {
  min_sat_vb: number;
  max_sat_vb: number;
  median_sat_vb: number;
  mean_sat_vb: number;
}

export type ScriptTypeDistribution = Record<string, number>;

export function computeFeeRateStats(feeRates: number[]): FeeRateStats {
  if (feeRates.length === 0) {
    return { min_sat_vb: 0, max_sat_vb: 0, median_sat_vb: 0, mean_sat_vb: 0 };
  }

  const sorted = [...feeRates].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length;

  let median: number;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }

  return {
    min_sat_vb: round2(min),
    max_sat_vb: round2(max),
    median_sat_vb: round2(median),
    mean_sat_vb: round2(mean),
  };
}

export function computeScriptTypeDistribution(
  types: OutputScriptType[],
): ScriptTypeDistribution {
  const dist: ScriptTypeDistribution = {};
  for (const t of types) {
    dist[t] = (dist[t] ?? 0) + 1;
  }
  return dist;
}

export function mergeScriptTypeDistributions(
  distributions: ScriptTypeDistribution[],
): ScriptTypeDistribution {
  const merged: ScriptTypeDistribution = {};
  for (const dist of distributions) {
    for (const [key, count] of Object.entries(dist)) {
      merged[key] = (merged[key] ?? 0) + count;
    }
  }
  return merged;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
