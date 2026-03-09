import { NextResponse } from "next/server";
import { listAvailableStems, getReport } from "@/lib/report-cache";
import type { FileSummary } from "@/lib/types";

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
