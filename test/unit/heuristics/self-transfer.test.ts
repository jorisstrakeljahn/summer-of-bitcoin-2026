import { describe, it, expect } from "vitest";
import { selfTransfer } from "../../../src/heuristics/self-transfer.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("Self-Transfer Detection Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(selfTransfer.analyze(ctx).detected).toBe(false);
  });

  it("detects self-transfer (1 output, same type, non-round)", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh"],
      inputValues: [100_000],
      outputValues: [95_123],
    });
    expect(selfTransfer.analyze(ctx).detected).toBe(true);
  });

  it("detects self-transfer (2 outputs, same type, non-round)", () => {
    const ctx = mockCtx({
      inputCount: 2,
      inputScriptTypes: ["p2tr", "p2tr"],
      outputScriptTypes: ["p2tr", "p2tr"],
      inputValues: [200_000, 100_000],
      outputValues: [250_321, 48_123],
    });
    expect(selfTransfer.analyze(ctx).detected).toBe(true);
  });

  it("returns false when outputs exceed 2 (excluding OP_RETURN)", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      inputValues: [300_000],
      outputValues: [100_000, 100_000, 90_000],
    });
    expect(selfTransfer.analyze(ctx).detected).toBe(false);
  });

  it("returns false when output type differs from dominant input type", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2tr"],
      inputValues: [100_000],
      outputValues: [95_000],
    });
    expect(selfTransfer.analyze(ctx).detected).toBe(false);
  });

  it("returns false when output has round BTC value", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh"],
      inputValues: [200_000],
      outputValues: [100_000_000], // 1 BTC
    });
    expect(selfTransfer.analyze(ctx).detected).toBe(false);
  });

  it("returns false when fee exceeds 5% of total input", () => {
    const ctx = mockCtx({
      inputCount: 1,
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2wpkh"],
      inputValues: [100_000],
      outputValues: [90_000],
      fee: 10_001, // > 5% of 100_000
    });
    expect(selfTransfer.analyze(ctx).detected).toBe(false);
  });
});
