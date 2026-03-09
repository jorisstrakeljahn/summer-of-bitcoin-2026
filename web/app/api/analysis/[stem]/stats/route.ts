import { NextResponse } from "next/server";
import { getReport } from "@/lib/report-cache";
import type {
  ClassificationDistribution,
  StatsResponse,
  TransactionClassification,
} from "@/lib/types";

const FEE_BUCKETS = [
  { min: 0, max: 5, label: "0-5" },
  { min: 5, max: 10, label: "5-10" },
  { min: 10, max: 20, label: "10-20" },
  { min: 20, max: 50, label: "20-50" },
  { min: 50, max: 100, label: "50-100" },
  { min: 100, max: 200, label: "100-200" },
  { min: 200, max: 500, label: "200-500" },
  { min: 500, max: Infinity, label: "500+" },
];

export function GET(
  _req: Request,
  { params }: { params: Promise<{ stem: string }> },
) {
  return params.then(({ stem }) => {
    try {
      const report = getReport(stem);

      const clsDist: ClassificationDistribution = {
        simple_payment: 0,
        batch_payment: 0,
        consolidation: 0,
        coinjoin: 0,
        self_transfer: 0,
        unknown: 0,
      };

      const heuristicDetections: Record<string, number> = {};
      const feeHistogram = FEE_BUCKETS.map((b) => ({
        range: b.label,
        count: 0,
      }));

      for (const block of report.blocks) {
        for (const tx of block.transactions) {
          const cls = tx.classification as TransactionClassification;
          if (cls in clsDist) clsDist[cls]++;

          for (const hId of Object.keys(tx.heuristics)) {
            heuristicDetections[hId] =
              (heuristicDetections[hId] ?? 0) + 1;
          }
        }
      }

      for (const block of report.blocks) {
        const stats = block.analysis_summary.fee_rate_stats;
        const avgFee = stats.mean_sat_vb;
        for (let i = 0; i < FEE_BUCKETS.length; i++) {
          if (avgFee >= FEE_BUCKETS[i].min && avgFee < FEE_BUCKETS[i].max) {
            feeHistogram[i].count++;
            break;
          }
        }
      }

      const blocksTimeline = report.blocks.map((b) => ({
        height: b.block_height,
        tx_count: b.tx_count,
        flagged: b.analysis_summary.flagged_transactions,
        avg_fee: b.analysis_summary.fee_rate_stats.mean_sat_vb,
        timestamp: b.block_timestamp,
      }));

      const response: StatsResponse = {
        classification_distribution: clsDist,
        heuristic_detections: heuristicDetections,
        fee_rate_histogram: feeHistogram,
        script_type_distribution:
          report.analysis_summary.script_type_distribution,
        blocks_timeline: blocksTimeline,
      };

      return NextResponse.json(response);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  });
}
