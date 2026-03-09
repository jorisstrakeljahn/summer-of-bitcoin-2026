/**
 * Chain analysis orchestrator.
 *
 * Reads raw block data, runs all heuristics on every transaction,
 * computes per-block and file-level statistics, and returns the
 * complete analysis report.
 */

import { iterateBlocks, extractBip34Height } from "./lib/block-parser.js";
import type { ParsedBlock } from "./lib/block-parser.js";
import type { BlockUndo } from "./lib/undo-parser.js";
import { computeTxid } from "./lib/tx-serializer.js";
import { classifyOutputScript } from "./lib/script.js";
import type { OutputScriptType } from "./lib/types.js";
import {
  buildTransactionContext,
  analyzeTransaction,
  HEURISTIC_IDS,
} from "./heuristics/index.js";
import type { TransactionAnalysis } from "./heuristics/index.js";
import { computeFeeRateStats, computeScriptTypeDistribution } from "./stats.js";
import { buildFileReport, countFlaggedTransactions } from "./report-json.js";
import type {
  ChainAnalysisReport,
  BlockAnalysis,
  BlockAnalysisData,
} from "./report-json.js";

export function analyzeBlockFile(
  blkData: Buffer,
  revData: Buffer,
  xorKey: Buffer,
  blkFilename: string,
): ChainAnalysisReport {
  const blockDataList: BlockAnalysisData[] = [];

  for (const { block, undo } of iterateBlocks(blkData, revData, xorKey)) {
    const blockAnalysisData = analyzeBlock(block, undo);
    blockDataList.push(blockAnalysisData);
  }

  return buildFileReport(blkFilename, blockDataList);
}

function analyzeBlock(
  block: ParsedBlock,
  undo: BlockUndo,
): BlockAnalysisData {
  const height = extractBip34Height(block);
  const transactions: TransactionAnalysis[] = [];
  const feeRates: number[] = [];
  const allOutputScriptTypes: OutputScriptType[] = [];

  for (let txIdx = 0; txIdx < block.transactions.length; txIdx++) {
    const tx = block.transactions[txIdx];
    const txid = computeTxid(tx);
    const isCoinbase = txIdx === 0;
    const prevouts = isCoinbase ? [] : undo[txIdx - 1] ?? [];

    const ctx = buildTransactionContext(tx, txid, txIdx, prevouts);
    const analysis = analyzeTransaction(ctx);
    transactions.push(analysis);

    if (!isCoinbase) {
      feeRates.push(ctx.feeRate);
    }

    for (const scriptType of ctx.outputScriptTypes) {
      allOutputScriptTypes.push(scriptType);
    }
  }

  const flagged = countFlaggedTransactions(transactions);
  const scriptDist = computeScriptTypeDistribution(allOutputScriptTypes);
  const feeStats = computeFeeRateStats(feeRates);

  const blockAnalysis: BlockAnalysis = {
    block_hash: block.header.blockHash,
    block_height: height,
    block_timestamp: block.header.timestamp,
    tx_count: block.transactions.length,
    analysis_summary: {
      total_transactions_analyzed: block.transactions.length,
      heuristics_applied: [...HEURISTIC_IDS],
      flagged_transactions: flagged,
      script_type_distribution: scriptDist,
      fee_rate_stats: feeStats,
    },
    transactions,
  };

  return { blockAnalysis, feeRates };
}
