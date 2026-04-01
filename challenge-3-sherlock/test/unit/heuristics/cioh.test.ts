import { describe, it, expect } from "vitest";
import { cioh } from "../../../src/heuristics/cioh.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("CIOH — Common Input Ownership Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true, inputCount: 1 });
    expect(cioh.analyze(ctx).detected).toBe(false);
  });

  it("returns false for single-input transactions", () => {
    const ctx = mockCtx({ inputCount: 1 });
    expect(cioh.analyze(ctx).detected).toBe(false);
  });

  it("detects multi-input transactions", () => {
    const ctx = mockCtx({ inputCount: 3 });
    const result = cioh.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.input_count).toBe(3);
  });

  it("detects two-input transactions", () => {
    const ctx = mockCtx({ inputCount: 2 });
    const result = cioh.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.input_count).toBe(2);
  });

  it("reports correct input count for many inputs", () => {
    const ctx = mockCtx({ inputCount: 50 });
    const result = cioh.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.input_count).toBe(50);
  });
});
