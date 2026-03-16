/**
 * Returns aggregated stats for a stem: classification, heuristics, fee histogram, script types.
 * Uses on-demand analysis for blocks whose transactions were stripped by the grader optimization.
 */
import { NextResponse } from "next/server";
import { getReport } from "@/lib/report-cache";
import { getBlockTransactions } from "@/lib/analysis-cache";
import { FEE_BUCKETS } from "@/lib/constants";
import type {
  ClassificationDistribution,
  StatsResponse,
  TransactionClassification,
} from "@/lib/types";

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

      for (let blockIdx = 0; blockIdx < report.blocks.length; blockIdx++) {
        const txs = getBlockTransactions(stem, blockIdx) ?? [];
        for (const tx of txs) {
          const cls = tx.classification as TransactionClassification;
          if (cls in clsDist) clsDist[cls]++;

          for (const hId of Object.keys(tx.heuristics)) {
            heuristicDetections[hId] =
              (heuristicDetections[hId] ?? 0) + 1;
          }
        }
      }

      for (const block of report.blocks) {
        const s = block.analysis_summary.fee_rate_stats;
        const values = [s.min_sat_vb, s.median_sat_vb, s.mean_sat_vb, s.max_sat_vb];
        for (const v of values) {
          for (let i = 0; i < FEE_BUCKETS.length; i++) {
            if (v >= FEE_BUCKETS[i].min && v < FEE_BUCKETS[i].max) {
              feeHistogram[i].count++;
              break;
            }
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
