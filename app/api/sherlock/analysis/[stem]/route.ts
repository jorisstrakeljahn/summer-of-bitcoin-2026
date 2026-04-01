/**
 * Returns full analysis report for a stem: blocks, summary, and block-level stats.
 */
import { NextResponse } from "next/server";
import { getReport } from "@/lib/sherlock/report-cache";
import type { BlockSummary } from "@/lib/sherlock/types";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ stem: string }> },
) {
  return params.then(({ stem }) => {
    try {
      const report = getReport(stem);
      const blocks: BlockSummary[] = report.blocks.map((b, i) => ({
        index: i,
        block_hash: b.block_hash,
        block_height: b.block_height,
        block_timestamp: b.block_timestamp,
        tx_count: b.tx_count,
        flagged: b.analysis_summary.flagged_transactions,
        fee_rate_stats: b.analysis_summary.fee_rate_stats,
      }));

      return NextResponse.json({
        stem,
        file: report.file,
        block_count: report.block_count,
        summary: report.analysis_summary,
        blocks,
      });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  });
}
