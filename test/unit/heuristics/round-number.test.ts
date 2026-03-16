import { describe, it, expect } from "vitest";
import { roundNumber } from "../../../src/heuristics/round-number.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("Round Number Payment Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(roundNumber.analyze(ctx).detected).toBe(false);
  });

  it("detects 1 BTC output as round", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [100_000_000, 42_317],
    });
    const result = roundNumber.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.round_outputs).toEqual([0]);
  });

  it("detects 0.1 BTC output as round", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [55_000, 10_000_000],
    });
    const result = roundNumber.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.round_outputs).toEqual([1]);
  });

  it("detects 0.0001 BTC output as round", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh"],
      outputValues: [10_000],
    });
    expect(roundNumber.analyze(ctx).detected).toBe(true);
  });

  it("detects multiple round outputs", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [100_000_000, 10_000_000, 42_317],
    });
    const result = roundNumber.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.round_outputs).toEqual([0, 1]);
  });

  it("returns false when no outputs are round", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [55_123, 42_317],
    });
    expect(roundNumber.analyze(ctx).detected).toBe(false);
  });

  it("ignores OP_RETURN outputs", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["op_return", "p2wpkh"],
      outputValues: [0, 42_317],
    });
    expect(roundNumber.analyze(ctx).detected).toBe(false);
  });
});
