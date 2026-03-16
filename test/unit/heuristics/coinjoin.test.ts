import { describe, it, expect } from "vitest";
import { coinjoin } from "../../../src/heuristics/coinjoin.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("CoinJoin Detection Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(coinjoin.analyze(ctx).detected).toBe(false);
  });

  it("detects classic CoinJoin (3+ inputs, 3+ equal outputs)", () => {
    const ctx = mockCtx({
      inputCount: 5,
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [100_000, 100_000, 100_000, 50_000, 30_000],
    });
    const result = coinjoin.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.sub_type).toBe("classic");
    expect(result.equal_output_count).toBe(3);
    expect(result.equal_output_value).toBe(100_000);
  });

  it("detects Whirlpool-style (inputs = outputs, all equal value)", () => {
    const ctx = mockCtx({
      inputCount: 4,
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [500_000, 500_000, 500_000, 500_000],
    });
    const result = coinjoin.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.sub_type).toBe("whirlpool");
    expect(result.equal_output_count).toBe(4);
  });

  it("detects possible PayJoin (2 inputs, 2 equal outputs)", () => {
    const ctx = mockCtx({
      inputCount: 2,
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [200_000, 200_000],
    });
    const result = coinjoin.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.sub_type).toBe("possible_payjoin");
  });

  it("returns false when no equal-value output groups exist", () => {
    const ctx = mockCtx({
      inputCount: 3,
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [100_000, 200_000, 300_000],
    });
    expect(coinjoin.analyze(ctx).detected).toBe(false);
  });

  it("returns false for 2-input tx with different output values", () => {
    const ctx = mockCtx({
      inputCount: 2,
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [100_000, 200_000],
    });
    expect(coinjoin.analyze(ctx).detected).toBe(false);
  });

  it("ignores OP_RETURN and zero-value outputs", () => {
    const ctx = mockCtx({
      inputCount: 3,
      outputScriptTypes: ["p2wpkh", "p2wpkh", "op_return", "p2wpkh"],
      outputValues: [100_000, 100_000, 0, 100_000],
    });
    const result = coinjoin.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.equal_output_count).toBe(3);
  });
});
