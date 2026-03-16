/**
 * Regression tests for the change-detection op_return bug.
 *
 * Previously, allSameType used ctx.outputScriptTypes[0] as the reference type.
 * When the first output was op_return, all real outputs were incorrectly
 * compared against "op_return" instead of the dominant spendable type.
 */
import { describe, it, expect } from "vitest";
import { changeDetection } from "../../../src/heuristics/change-detection.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("Change Detection — OP_RETURN regression", () => {
  it("correctly identifies change when op_return is the first output", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["op_return", "p2wpkh", "p2tr"],
      outputValues: [0, 50_000, 30_123],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(1);
    expect(result.confidence).toBe("high");
  });

  it("correctly identifies change when op_return is between real outputs", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["p2tr", "op_return", "p2wpkh"],
      outputValues: [100_000_000, 0, 42_317],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(2);
    expect(result.confidence).toBe("high");
  });

  it("returns high confidence via script+round when all real outputs share type, with op_return first", () => {
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

  it("handles multiple op_return outputs correctly", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["op_return", "op_return", "p2wpkh", "p2tr"],
      outputValues: [0, 0, 50_000, 30_123],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(2);
    expect(result.confidence).toBe("high");
  });

  it("does not count op_return in non-round indices", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2sh"],
      outputScriptTypes: ["op_return", "p2sh", "p2sh"],
      outputValues: [0, 100_000_000, 42_317],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.likely_change_index).toBe(2);
    expect(result.method).toBe("script_type_and_round_number");
    expect(result.confidence).toBe("high");
  });

  it("works with only op_return outputs (degenerate case)", () => {
    const ctx = mockCtx({
      inputScriptTypes: ["p2wpkh"],
      outputScriptTypes: ["op_return", "op_return"],
      outputValues: [0, 0],
    });
    const result = changeDetection.analyze(ctx);
    expect(result.detected).toBe(false);
  });
});
