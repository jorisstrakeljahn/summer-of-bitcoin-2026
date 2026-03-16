import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { analyzeBlockFile } from "../../src/chain-analyzer.js";
import { HEURISTIC_IDS } from "../../src/heuristics/index.js";
import type { TransactionClassification } from "../../src/heuristics/types.js";

const FIXTURES = join(__dirname, "..", "..", "fixtures");

function loadFixture(stem: string) {
  const suffix = stem.replace("blk", "");
  return {
    blk: readFileSync(join(FIXTURES, `blk${suffix}.dat`)),
    rev: readFileSync(join(FIXTURES, `rev${suffix}.dat`)),
    xor: readFileSync(join(FIXTURES, "xor.dat")),
  };
}

describe("Chain Analyzer — full pipeline integration", () => {
  const { blk, rev, xor } = loadFixture("blk04330");
  const report = analyzeBlockFile(blk, rev, xor, "blk04330.dat");

  it("produces a valid report", () => {
    expect(report.ok).toBe(true);
    expect(report.mode).toBe("chain_analysis");
    expect(report.file).toBe("blk04330.dat");
  });

  it("parses the expected number of blocks", () => {
    expect(report.block_count).toBe(84);
    expect(report.blocks).toHaveLength(84);
  });

  it("analyzes a significant number of transactions", () => {
    expect(report.analysis_summary.total_transactions_analyzed).toBeGreaterThan(300_000);
  });

  it("applies all 9 heuristics", () => {
    for (const id of HEURISTIC_IDS) {
      expect(report.analysis_summary.heuristics_applied).toContain(id);
    }
  });

  it("flags a large portion of transactions", () => {
    expect(report.analysis_summary.flagged_transactions).toBeGreaterThan(0);
    const ratio =
      report.analysis_summary.flagged_transactions /
      report.analysis_summary.total_transactions_analyzed;
    expect(ratio).toBeGreaterThan(0.5);
  });

  it("produces valid fee rate statistics", () => {
    const stats = report.analysis_summary.fee_rate_stats;
    expect(stats.min_sat_vb).toBeGreaterThanOrEqual(0);
    expect(stats.max_sat_vb).toBeGreaterThan(stats.min_sat_vb);
    expect(stats.median_sat_vb).toBeGreaterThanOrEqual(stats.min_sat_vb);
    expect(stats.median_sat_vb).toBeLessThanOrEqual(stats.max_sat_vb);
  });

  it("produces script type distribution with known types", () => {
    const dist = report.analysis_summary.script_type_distribution;
    expect(dist.p2wpkh).toBeGreaterThan(0);
    expect(dist.p2tr).toBeGreaterThan(0);
  });

  it("classifies the first transaction of block 0 as unknown (coinbase)", () => {
    const firstTx = report.blocks[0].transactions[0];
    expect(firstTx.classification).toBe("unknown");
  });

  it("contains all classification types across the dataset", () => {
    const seen = new Set<TransactionClassification>();
    for (const block of report.blocks) {
      for (const tx of block.transactions) {
        seen.add(tx.classification);
      }
    }
    expect(seen.has("simple_payment")).toBe(true);
    expect(seen.has("batch_payment")).toBe(true);
    expect(seen.has("consolidation")).toBe(true);
    expect(seen.has("self_transfer")).toBe(true);
    expect(seen.has("coinjoin")).toBe(true);
    expect(seen.has("unknown")).toBe(true);
  });

  it("sorts blocks by height (ascending)", () => {
    for (let i = 1; i < report.blocks.length; i++) {
      expect(report.blocks[i].block_height).toBeGreaterThan(
        report.blocks[i - 1].block_height,
      );
    }
  });

  it("block tx_count matches transactions array length", () => {
    const block = report.blocks[0];
    expect(block.tx_count).toBe(block.transactions.length);
  });
});
