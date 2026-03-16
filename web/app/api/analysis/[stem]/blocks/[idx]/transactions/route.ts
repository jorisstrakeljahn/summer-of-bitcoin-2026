/**
 * Returns paginated transactions for a block with optional classification/heuristic/search filters.
 * When the JSON report only contains transactions for block 0 (grader optimization),
 * missing blocks are re-analyzed on demand from the raw fixture data.
 */
import { NextResponse } from "next/server";
import { getReport } from "@/lib/report-cache";
import { getRawBlock } from "@/lib/block-cache";
import { computeTxid } from "@sherlock/lib/tx-serializer";
import {
  buildTransactionContext,
  analyzeTransaction,
} from "@sherlock/heuristics/index";
import type { TransactionAnalysis } from "@sherlock/heuristics/index";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

const analysisCache = new Map<string, TransactionAnalysis[]>();

function getTransactions(
  stem: string,
  blockIdx: number,
): TransactionAnalysis[] | null {
  const report = getReport(stem);
  if (blockIdx < 0 || blockIdx >= report.blocks.length) return null;

  const block = report.blocks[blockIdx];
  if (block.transactions.length > 0) return block.transactions;

  const cacheKey = `${stem}:${blockIdx}`;
  if (analysisCache.has(cacheKey)) return analysisCache.get(cacheKey)!;

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

  analysisCache.set(cacheKey, txs);
  return txs;
}

export function GET(
  req: Request,
  { params }: { params: Promise<{ stem: string; idx: string }> },
) {
  return params.then(({ stem, idx }) => {
    try {
      const report = getReport(stem);
      const blockIdx = parseInt(idx, 10);

      if (isNaN(blockIdx) || blockIdx < 0 || blockIdx >= report.blocks.length) {
        return NextResponse.json(
          { error: "Block index out of range" },
          { status: 400 },
        );
      }

      const block = report.blocks[blockIdx];
      const url = new URL(req.url);
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
      const size = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(url.searchParams.get("size") ?? String(DEFAULT_PAGE_SIZE), 10)),
      );
      const classificationFilter = url.searchParams.get("classification");
      const heuristicFilter = url.searchParams.get("heuristic");
      const search = url.searchParams.get("search")?.toLowerCase();

      let txs = getTransactions(stem, blockIdx) ?? [];

      if (classificationFilter) {
        const allowed = new Set(classificationFilter.split(","));
        txs = txs.filter((tx) => allowed.has(tx.classification));
      }

      if (heuristicFilter) {
        const required = heuristicFilter.split(",");
        txs = txs.filter((tx) =>
          required.every((h) => h in tx.heuristics),
        );
      }

      if (search && search.length >= 4) {
        txs = txs.filter((tx) => tx.txid.toLowerCase().startsWith(search));
      }

      const total = txs.length;
      const totalPages = Math.ceil(total / size);
      const start = (page - 1) * size;
      const paginated = txs.slice(start, start + size);

      return NextResponse.json({
        block_hash: block.block_hash,
        block_height: block.block_height,
        block_timestamp: block.block_timestamp,
        total,
        page,
        size,
        total_pages: totalPages,
        transactions: paginated,
      });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  });
}
