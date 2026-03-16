import { describe, it, expect } from "vitest";
import { countFlaggedTransactions, buildFileReport } from "../../src/report-json.js";
import type { TransactionAnalysis } from "../../src/heuristics/index.js";
import type { BlockAnalysisData, BlockAnalysis } from "../../src/report-json.js";

function makeTx(
  txid: string,
  heuristics: Record<string, { detected: boolean }>,
  classification = "simple_payment" as const,
): TransactionAnalysis {
  return { txid, heuristics, classification };
}

describe("countFlaggedTransactions", () => {
  it("returns 0 for no transactions", () => {
    expect(countFlaggedTransactions([])).toBe(0);
  });

  it("returns 0 when no heuristics detected", () => {
    const txs = [
      makeTx("tx1", { cioh: { detected: false } }),
      makeTx("tx2", {}),
    ];
    expect(countFlaggedTransactions(txs)).toBe(0);
  });

  it("counts transactions with at least one detected heuristic", () => {
    const txs = [
      makeTx("tx1", { cioh: { detected: true } }),
      makeTx("tx2", { cioh: { detected: false } }),
      makeTx("tx3", { cioh: { detected: true }, consolidation: { detected: true } }),
    ];
    expect(countFlaggedTransactions(txs)).toBe(2);
  });

  it("counts each flagged transaction only once even with multiple detections", () => {
    const txs = [
      makeTx("tx1", {
        cioh: { detected: true },
        change_detection: { detected: true },
        round_number_payment: { detected: true },
      }),
    ];
    expect(countFlaggedTransactions(txs)).toBe(1);
  });
});

describe("buildFileReport", () => {
  it("builds a valid report from block data", () => {
    const block: BlockAnalysis = {
      block_hash: "00".repeat(32),
      block_height: 847493,
      block_timestamp: 1718000000,
      tx_count: 2,
      analysis_summary: {
        total_transactions_analyzed: 2,
        heuristics_applied: ["cioh", "change_detection"],
        flagged_transactions: 1,
        script_type_distribution: { p2wpkh: 3 },
        fee_rate_stats: { min_sat_vb: 10, max_sat_vb: 30, median_sat_vb: 20, mean_sat_vb: 20 },
      },
      transactions: [
        makeTx("tx1", {}),
        makeTx("tx2", { cioh: { detected: true } }),
      ],
    };

    const blockData: BlockAnalysisData = {
      blockAnalysis: block,
      feeRates: [10, 30],
    };

    const report = buildFileReport("blk00001.dat", [blockData]);
    expect(report.ok).toBe(true);
    expect(report.mode).toBe("chain_analysis");
    expect(report.file).toBe("blk00001.dat");
    expect(report.block_count).toBe(1);
    expect(report.blocks).toHaveLength(1);
    expect(report.analysis_summary.total_transactions_analyzed).toBe(2);
    expect(report.analysis_summary.heuristics_applied).toContain("cioh");
  });

  it("aggregates stats across multiple blocks", () => {
    const makeBlock = (height: number, feeRates: number[]): BlockAnalysisData => ({
      blockAnalysis: {
        block_hash: "00".repeat(32),
        block_height: height,
        block_timestamp: 1718000000,
        tx_count: feeRates.length,
        analysis_summary: {
          total_transactions_analyzed: feeRates.length,
          heuristics_applied: ["cioh"],
          flagged_transactions: 0,
          script_type_distribution: { p2wpkh: feeRates.length },
          fee_rate_stats: { min_sat_vb: 0, max_sat_vb: 0, median_sat_vb: 0, mean_sat_vb: 0 },
        },
        transactions: [],
      },
      feeRates,
    });

    const report = buildFileReport("test.dat", [
      makeBlock(100, [10, 20]),
      makeBlock(101, [30, 40]),
    ]);
    expect(report.block_count).toBe(2);
    expect(report.analysis_summary.total_transactions_analyzed).toBe(4);
    expect(report.analysis_summary.script_type_distribution.p2wpkh).toBe(4);
  });
});
