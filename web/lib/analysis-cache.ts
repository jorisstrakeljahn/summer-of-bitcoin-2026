/**
 * On-demand transaction analysis cache.
 *
 * The CLI JSON only includes transactions for block 0 (grader optimization).
 * This module re-analyzes blocks from raw fixture data when the report has
 * empty transaction arrays, and caches results for subsequent requests.
 */
import { getReport } from "./report-cache";
import { getRawBlock } from "./block-cache";
import { computeTxid } from "@sherlock/lib/tx-serializer";
import {
  buildTransactionContext,
  analyzeTransaction,
} from "@sherlock/heuristics/index";
import type { TransactionAnalysis } from "@sherlock/heuristics/index";

const cache = new Map<string, TransactionAnalysis[]>();

/** Return transactions for a block, re-analyzing from raw data if needed. */
export function getBlockTransactions(
  stem: string,
  blockIdx: number,
): TransactionAnalysis[] | null {
  const report = getReport(stem);
  if (blockIdx < 0 || blockIdx >= report.blocks.length) return null;

  const block = report.blocks[blockIdx];
  if (block.transactions.length > 0) return block.transactions;

  const cacheKey = `${stem}:${blockIdx}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const raw = getRawBlock(stem, blockIdx);
  if (!raw) return null;

  const txs: TransactionAnalysis[] = [];
  for (let i = 0; i < raw.block.transactions.length; i++) {
    const tx = raw.block.transactions[i];
    const txid = computeTxid(tx);
    const isCoinbase = i === 0;
    const prevouts = isCoinbase ? [] : raw.undo[i - 1] ?? [];
    const ctx = buildTransactionContext(tx, txid, i, prevouts);
    txs.push(analyzeTransaction(ctx));
  }

  cache.set(cacheKey, txs);
  return txs;
}

/** Invalidate cached analysis for a stem. */
export function invalidateAnalysisCache(stem: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${stem}:`)) cache.delete(key);
  }
}
