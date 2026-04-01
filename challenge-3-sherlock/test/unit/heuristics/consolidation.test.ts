import { describe, it, expect } from "vitest";
import { consolidation } from "../../../src/heuristics/consolidation.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("Consolidation Detection Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(consolidation.analyze(ctx).detected).toBe(false);
  });

  it("detects consolidation (many inputs, 1 output, same script type)", () => {
    const ctx = mockCtx({
      inputCount: 5,
      inputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh"],
      outputValues: [451_234],
    });
    const result = consolidation.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.input_count).toBe(5);
    expect(result.output_count).toBe(1);
  });

  it("detects consolidation with 2 outputs", () => {
    const ctx = mockCtx({
      inputCount: 4,
      inputScriptTypes: ["p2tr", "p2tr", "p2tr", "p2tr"],
      outputScriptTypes: ["p2tr", "p2tr"],
      outputValues: [301_234, 91_567],
    });
    const result = consolidation.analyze(ctx);
    expect(result.detected).toBe(true);
  });

  it("returns false when inputs are fewer than 3", () => {
    const ctx = mockCtx({
      inputCount: 2,
      inputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh"],
      outputValues: [180_000],
    });
    expect(consolidation.analyze(ctx).detected).toBe(false);
  });

  it("returns false when outputs exceed 2 (excluding OP_RETURN)", () => {
    const ctx = mockCtx({
      inputCount: 5,
      inputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [200_000, 150_000, 100_000],
    });
    expect(consolidation.analyze(ctx).detected).toBe(false);
  });

  it("returns false when output script type differs from dominant input type", () => {
    const ctx = mockCtx({
      inputCount: 3,
      inputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2tr"],
      outputValues: [280_000],
    });
    expect(consolidation.analyze(ctx).detected).toBe(false);
  });

  it("returns false when output has round BTC value", () => {
    const ctx = mockCtx({
      inputCount: 4,
      inputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh"],
      outputValues: [100_000_000], // 1 BTC — round number
    });
    expect(consolidation.analyze(ctx).detected).toBe(false);
  });

  it("ignores OP_RETURN outputs when counting", () => {
    const ctx = mockCtx({
      inputCount: 3,
      inputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh", "op_return"],
      outputValues: [281_234, 0],
    });
    const result = consolidation.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.output_count).toBe(1);
  });
});
