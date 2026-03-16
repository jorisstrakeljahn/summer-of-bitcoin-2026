/**
 * Returns paginated transactions for a block with optional classification/heuristic/search filters.
 */
import { NextResponse } from "next/server";
import { getReport } from "@/lib/report-cache";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

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

      let txs = block.transactions;

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
