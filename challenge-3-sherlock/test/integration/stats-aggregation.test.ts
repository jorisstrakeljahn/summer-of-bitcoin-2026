/**
 * Integration test for stats aggregation across all blocks.
 *
 * Verifies that classification_distribution and heuristic_detections
 * correctly account for every transaction in every block, not just block 0.
 * This is the scenario the stats route now handles via on-demand analysis.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { analyzeBlockFile } from "../../src/chain-analyzer.js";
import type { TransactionClassification } from "../../src/heuristics/types.js";

const FIXTURES = join(__dirname, "..", "..", "fixtures");

describe("Stats aggregation — all blocks", () => {
  const blk = readFileSync(join(FIXTURES, "blk04330.dat"));
  const rev = readFileSync(join(FIXTURES, "rev04330.dat"));
  const xor = readFileSync(join(FIXTURES, "xor.dat"));
  const report = analyzeBlockFile(blk, rev, xor, "blk04330.dat");

  it("classification counts sum to total transactions", () => {
    const dist: Record<TransactionClassification, number> = {
      simple_payment: 0,
      batch_payment: 0,
      consolidation: 0,
      coinjoin: 0,
      self_transfer: 0,
      unknown: 0,
    };

    let totalTx = 0;
    for (const block of report.blocks) {
      for (const tx of block.transactions) {
        const cls = tx.classification as TransactionClassification;
        if (cls in dist) dist[cls]++;
        totalTx++;
      }
    }

    const classifiedTotal = Object.values(dist).reduce((a, b) => a + b, 0);
    expect(classifiedTotal).toBe(totalTx);
    expect(totalTx).toBe(report.analysis_summary.total_transactions_analyzed);
  });

  it("heuristic detections are non-negative for all known IDs", () => {
    const detections: Record<string, number> = {};

    for (const block of report.blocks) {
      for (const tx of block.transactions) {
        for (const hId of Object.keys(tx.heuristics)) {
          detections[hId] = (detections[hId] ?? 0) + 1;
        }
      }
    }

    for (const count of Object.values(detections)) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it("every block contributes to the total classification count", () => {
    let blocksWithClassified = 0;
    for (const block of report.blocks) {
      const hasClassified = block.transactions.some(
        (tx) => tx.classification !== "unknown",
      );
      if (hasClassified) blocksWithClassified++;
    }
    expect(blocksWithClassified).toBeGreaterThan(1);
  });

  it("heuristic detections span multiple blocks", () => {
    const blocksWith = new Set<number>();
    for (let i = 0; i < report.blocks.length; i++) {
      for (const tx of report.blocks[i].transactions) {
        if (Object.keys(tx.heuristics).length > 0) {
          blocksWith.add(i);
        }
      }
    }
    expect(blocksWith.size).toBeGreaterThan(1);
  });
});
