import { describe, it, expect } from "vitest";
import { classifyTransaction } from "../../../src/heuristics/classifier.js";
import { mockCtx } from "../../helpers/mock-tx.js";
import type { HeuristicResult } from "../../../src/heuristics/types.js";

const D: HeuristicResult = { detected: true };
const ND: HeuristicResult = { detected: false };

describe("Transaction Classifier", () => {
  it("classifies coinbase as unknown", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(classifyTransaction(ctx, {})).toBe("unknown");
  });

  it("prioritizes coinjoin over everything", () => {
    const ctx = mockCtx({ inputCount: 5, outputCount: 5 });
    const results = {
      coinjoin: D,
      consolidation: D,
      self_transfer: D,
    };
    expect(classifyTransaction(ctx, results)).toBe("coinjoin");
  });

  it("prioritizes consolidation over self_transfer", () => {
    const ctx = mockCtx({ inputCount: 5, outputCount: 1 });
    const results = {
      coinjoin: ND,
      consolidation: D,
      self_transfer: D,
    };
    expect(classifyTransaction(ctx, results)).toBe("consolidation");
  });

  it("classifies self_transfer when consolidation is not detected", () => {
    const ctx = mockCtx({ inputCount: 1, outputCount: 2 });
    const results = {
      coinjoin: ND,
      consolidation: ND,
      self_transfer: D,
    };
    expect(classifyTransaction(ctx, results)).toBe("self_transfer");
  });

  it("classifies batch_payment for 3+ non-OP_RETURN outputs", () => {
    const ctx = mockCtx({
      inputCount: 1,
      outputScriptTypes: ["p2wpkh", "p2tr", "p2sh"],
      outputValues: [50_000, 40_000, 30_000],
    });
    const results = { coinjoin: ND, consolidation: ND, self_transfer: ND };
    expect(classifyTransaction(ctx, results)).toBe("batch_payment");
  });

  it("classifies simple_payment for 1-2 output transactions", () => {
    const ctx = mockCtx({
      inputCount: 1,
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [50_000, 40_000],
    });
    const results = { coinjoin: ND, consolidation: ND, self_transfer: ND };
    expect(classifyTransaction(ctx, results)).toBe("simple_payment");
  });

  it("classifies single-output transaction as simple_payment", () => {
    const ctx = mockCtx({
      inputCount: 1,
      outputScriptTypes: ["p2wpkh"],
      outputValues: [90_000],
    });
    const results = {};
    expect(classifyTransaction(ctx, results)).toBe("simple_payment");
  });

  it("excludes OP_RETURN from output count for batch classification", () => {
    const ctx = mockCtx({
      inputCount: 1,
      outputScriptTypes: ["p2wpkh", "p2wpkh", "op_return"],
      outputValues: [50_000, 40_000, 0],
    });
    const results = {};
    expect(classifyTransaction(ctx, results)).toBe("simple_payment");
  });
});
