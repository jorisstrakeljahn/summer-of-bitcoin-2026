import { describe, it, expect } from "vitest";
import { opReturn } from "../../../src/heuristics/op-return.js";
import { mockCtx } from "../../helpers/mock-tx.js";

describe("OP_RETURN Analysis Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(opReturn.analyze(ctx).detected).toBe(false);
  });

  it("returns false when no OP_RETURN outputs exist", () => {
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [50_000, 40_000],
    });
    expect(opReturn.analyze(ctx).detected).toBe(false);
  });

  it("detects OP_RETURN output with unknown protocol", () => {
    const opReturnScript = Buffer.from("6a0b68656c6c6f20776f726c64", "hex"); // OP_RETURN "hello world"
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "op_return"],
      outputValues: [90_000, 0],
      tx: {
        outputs: [
          { value: 90_000n, scriptPubKey: Buffer.from("0014" + "aa".repeat(20), "hex") },
          { value: 0n, scriptPubKey: opReturnScript },
        ],
      },
    });
    const result = opReturn.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.count).toBe(1);
    expect(result.protocols).toContain("unknown");
  });

  it("detects Omni Layer protocol in OP_RETURN", () => {
    // OP_RETURN with Omni magic bytes (6f6d6e69 = "omni")
    const omniPayload = "6f6d6e69" + "00".repeat(16);
    const omniScript = Buffer.from("6a14" + omniPayload, "hex");
    const ctx = mockCtx({
      outputScriptTypes: ["p2wpkh", "op_return"],
      outputValues: [90_000, 0],
      tx: {
        outputs: [
          { value: 90_000n, scriptPubKey: Buffer.from("0014" + "aa".repeat(20), "hex") },
          { value: 0n, scriptPubKey: omniScript },
        ],
      },
    });
    const result = opReturn.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.protocols).toContain("omni");
  });
});
