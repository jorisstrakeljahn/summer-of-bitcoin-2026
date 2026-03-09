/**
 * JSON report builder for chain analysis output.
 *
 * Constructs the schema-compliant JSON structure from per-block
 * analysis results and aggregates file-level statistics.
 */

import type { TransactionAnalysis } from "./heuristics/index.js";
import type { FeeRateStats, ScriptTypeDistribution } from "./stats.js";
import {
  computeFeeRateStats,
  mergeScriptTypeDistributions,
} from "./stats.js";

export interface BlockAnalysis {
  block_hash: string;
  block_height: number;
  block_timestamp: number;
  tx_count: number;
  analysis_summary: AnalysisSummary;
  transactions: TransactionAnalysis[];
}

export interface AnalysisSummary {
  total_transactions_analyzed: number;
  heuristics_applied: string[];
  flagged_transactions: number;
  script_type_distribution: ScriptTypeDistribution;
  fee_rate_stats: FeeRateStats;
}

export interface ChainAnalysisReport {
  ok: true;
  mode: "chain_analysis";
  file: string;
  block_count: number;
  analysis_summary: AnalysisSummary;
  blocks: BlockAnalysis[];
}

export interface BlockAnalysisData {
  blockAnalysis: BlockAnalysis;
  feeRates: number[];
}

export function buildFileReport(
  filename: string,
  blockData: BlockAnalysisData[],
): ChainAnalysisReport {
  const blocks = blockData.map(d => d.blockAnalysis);

  const totalTx = blocks.reduce((s, b) => s + b.tx_count, 0);
  const totalFlagged = blocks.reduce(
    (s, b) => s + b.analysis_summary.flagged_transactions, 0,
  );

  const allHeuristics = new Set<string>();
  for (const block of blocks) {
    for (const id of block.analysis_summary.heuristics_applied) {
      allHeuristics.add(id);
    }
  }

  const allFeeRates = blockData.flatMap(d => d.feeRates);

  const mergedDist = mergeScriptTypeDistributions(
    blocks.map(b => b.analysis_summary.script_type_distribution),
  );

  return {
    ok: true,
    mode: "chain_analysis",
    file: filename,
    block_count: blocks.length,
    analysis_summary: {
      total_transactions_analyzed: totalTx,
      heuristics_applied: [...allHeuristics],
      flagged_transactions: totalFlagged,
      script_type_distribution: mergedDist,
      fee_rate_stats: computeFeeRateStats(allFeeRates),
    },
    blocks,
  };
}

export function countFlaggedTransactions(
  transactions: TransactionAnalysis[],
): number {
  let count = 0;
  for (const tx of transactions) {
    for (const result of Object.values(tx.heuristics)) {
      if (result.detected) {
        count++;
        break;
      }
    }
  }
  return count;
}
