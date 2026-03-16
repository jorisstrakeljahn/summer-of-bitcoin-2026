import { describe, it, expect } from "vitest";
import { changeDetection } from "../../../src/heuristics/change-detection.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("Change Detection Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(changeDetection.analyze(ctx).detected).toBe(false);
  });

  it("returns false for single-output transactions", () => {
    const ctx = mockCtx({ outputCount: 1, outputScriptTypes: ["p2wpkh"], outputValues: [90_000] });
    expect(changeDetection.analyze(ctx).detected).toBe(false);
  });

  it("detects change via script type match (high confidence)", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2tr", "p2wpkh"],
      outputValues: [100_000_000, 42_317],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(1);
    expect(result.confidence).toBe("high");
  });

  it("detects change via script type + round number (high confidence)", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [100_000_000, 12_345],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(1);
    expect(result.confidence).toBe("high");
  });

  it("detects change via round number only (low confidence)", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2tr"],
      outputScriptTypes: ["p2wpkh", "p2sh"],
      outputValues: [100_000_000, 55_123],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(1);
    expect(result.confidence).toBe("low");
  });

  it("falls back to output value analysis (low confidence)", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2tr"],
      outputScriptTypes: ["p2sh", "p2wpkh"],
      outputValues: [80_000, 20_000],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(0);
    expect(result.confidence).toBe("low");
  });

  it("handles op_return as first output without corrupting allSameType check", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["op_return", "p2wpkh", "p2tr"],
      outputValues: [0, 50_000, 30_123],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(1);
    expect(result.method).toBe("script_type_match");
    expect(result.confidence).toBe("high");
  });

  it("gives high confidence via script+round when all real outputs share type with op_return", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["op_return", "p2wpkh", "p2wpkh"],
      outputValues: [0, 100_000_000, 12_345],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(2);
    expect(result.method).toBe("script_type_and_round_number");
    expect(result.confidence).toBe("high");
  });

  it("ignores op_return outputs when computing non-round indices", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2sh"],
      outputScriptTypes: ["p2wpkh", "op_return", "p2sh"],
      outputValues: [100_000_000, 0, 42_317],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(2);
  });
});
