import { describe, it, expect } from "vitest";
import { peelingChain } from "../../../src/heuristics/peeling-chain.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("Peeling Chain Detection Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(peelingChain.analyze(ctx).detected).toBe(false);
  });

  it("detects peeling pattern (1 input, 2 outputs, 10:1 ratio, matching type)", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [1_000_000, 50_000],
    });
    const result = peelingChain.analyze(ctx);
    expect(result.detected).toBe(true);
  });

  it("returns false when ratio is below threshold", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [100_000, 50_000], // 2:1 ratio, below 10:1
    });
    expect(peelingChain.analyze(ctx).detected).toBe(false);
  });

  it("returns false when more than 2 inputs", () => {
    const ctx = mockCtx({
      inputCount: 3,
      inputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [1_000_000, 50_000],
    });
    expect(peelingChain.analyze(ctx).detected).toBe(false);
  });

  it("returns false when larger output type differs from input type", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2tr", "p2wpkh"],
      outputValues: [1_000_000, 50_000], // p2tr is larger but doesn't match p2wpkh input
    });
    expect(peelingChain.analyze(ctx).detected).toBe(false);
  });

  it("returns false when output count is not exactly 2", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [1_000_000, 50_000, 10_000],
    });
    expect(peelingChain.analyze(ctx).detected).toBe(false);
  });

  it("returns false when one output is zero", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [1_000_000, 0],
    });
    expect(peelingChain.analyze(ctx).detected).toBe(false);
  });

  it("works when smaller output is first (reversed order)", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [50_000, 1_000_000],
    });
    expect(peelingChain.analyze(ctx).detected).toBe(true);
  });
});
