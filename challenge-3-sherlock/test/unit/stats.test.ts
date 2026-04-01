import { describe, it, expect } from "vitest";
import {
  computeFeeRateStats,
  computeScriptTypeDistribution,
  mergeScriptTypeDistributions,
} from "../../src/stats.js";

describe("computeFeeRateStats", () => {
  it("returns zeros for empty array", () => {
    const result = computeFeeRateStats([]);
    expect(result.min_sat_vb).toBe(0);
    expect(result.max_sat_vb).toBe(0);
    expect(result.median_sat_vb).toBe(0);
    expect(result.mean_sat_vb).toBe(0);
  });

  it("handles single value", () => {
    const result = computeFeeRateStats([25]);
    expect(result.min_sat_vb).toBe(25);
    expect(result.max_sat_vb).toBe(25);
    expect(result.median_sat_vb).toBe(25);
    expect(result.mean_sat_vb).toBe(25);
  });

  it("computes correct median for odd count", () => {
    const result = computeFeeRateStats([10, 30, 20]);
    expect(result.median_sat_vb).toBe(20);
  });

  it("computes correct median for even count", () => {
    const result = computeFeeRateStats([10, 20, 30, 40]);
    expect(result.median_sat_vb).toBe(25);
  });

  it("computes correct min, max, and mean", () => {
    const result = computeFeeRateStats([5, 10, 15, 20]);
    expect(result.min_sat_vb).toBe(5);
    expect(result.max_sat_vb).toBe(20);
    expect(result.mean_sat_vb).toBe(12.5);
  });

  it("rounds values to 2 decimal places", () => {
    const result = computeFeeRateStats([1, 2, 3]);
    expect(result.mean_sat_vb).toBe(2);
  });
});

describe("computeScriptTypeDistribution", () => {
  it("counts script types correctly", () => {
    const types = ["p2wpkh", "p2wpkh", "p2tr", "p2sh"] as const;
    const dist = computeScriptTypeDistribution([...types]);
    expect(dist.p2wpkh).toBe(2);
    expect(dist.p2tr).toBe(1);
    expect(dist.p2sh).toBe(1);
  });

  it("handles empty array", () => {
    const dist = computeScriptTypeDistribution([]);
    expect(Object.keys(dist)).toHaveLength(0);
  });
});

describe("mergeScriptTypeDistributions", () => {
  it("merges multiple distributions", () => {
    const a = { p2wpkh: 5, p2tr: 3 };
    const b = { p2wpkh: 2, p2sh: 1 };
    const merged = mergeScriptTypeDistributions([a, b]);
    expect(merged.p2wpkh).toBe(7);
    expect(merged.p2tr).toBe(3);
    expect(merged.p2sh).toBe(1);
  });

  it("returns empty for no distributions", () => {
    const merged = mergeScriptTypeDistributions([]);
    expect(Object.keys(merged)).toHaveLength(0);
  });
});
