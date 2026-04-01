/**
 * Lists available analysis files (stems) with block count, total tx, and flagged counts.
 */
import { NextResponse } from "next/server";
import { listAvailableStems, getReport } from "@/lib/sherlock/report-cache";
import type { FileSummary } from "@/lib/sherlock/types";

export function GET() {
  const stems = listAvailableStems();
  const summaries: FileSummary[] = stems.map((stem) => {
    const report = getReport(stem);
    return {
      stem,
      block_count: report.block_count,
      total_tx: report.analysis_summary.total_transactions_analyzed,
      flagged: report.analysis_summary.flagged_transactions,
    };
  });
  return NextResponse.json(summaries);
}
