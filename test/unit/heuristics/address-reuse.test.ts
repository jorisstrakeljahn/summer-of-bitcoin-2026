import { describe, it, expect } from "vitest";
import { addressReuse } from "../../../src/heuristics/address-reuse.js";
import { mockCtx } from "../../helpers/mock-tx.js";

// P2WPKH scriptPubKey: OP_0 <20-byte-hash>
const SCRIPT_A = "0014" + "aa".repeat(20);
const SCRIPT_B = "0014" + "bb".repeat(20);

function prevout(scriptHex: string, value = 100_000) {
  return { value_sats: value, script_pubkey_hex: scriptHex };
}

describe("Address Reuse Heuristic", () => {
  it("returns false for coinbase transactions", () => {
    const ctx = mockCtx({ isCoinbase: true });
    expect(addressReuse.analyze(ctx).detected).toBe(false);
  });

  it("detects reused address when input and output share same script", () => {
    const ctx = mockCtx({
      inputCount: 1,
      outputCount: 2,
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [50_000, 40_000],
      prevouts: [prevout(SCRIPT_A)],
      tx: {
        outputs: [
          { value: 50_000n, scriptPubKey: Buffer.from(SCRIPT_A, "hex") },
          { value: 40_000n, scriptPubKey: Buffer.from(SCRIPT_B, "hex") },
        ],
      },
    });
    const result = addressReuse.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.reused_addresses).toBeDefined();
    expect(result.reused_addresses!.length).toBeGreaterThan(0);
  });

  it("returns false when no addresses are reused", () => {
    const ctx = mockCtx({
      inputCount: 1,
      outputCount: 2,
      outputScriptTypes: ["p2wpkh", "p2wpkh"],
      outputValues: [50_000, 40_000],
      prevouts: [prevout(SCRIPT_A)],
      tx: {
        outputs: [
          { value: 50_000n, scriptPubKey: Buffer.from(SCRIPT_B, "hex") },
          { value: 40_000n, scriptPubKey: Buffer.from("0014" + "cc".repeat(20), "hex") },
        ],
      },
    });
    const result = addressReuse.analyze(ctx);
    expect(result.detected).toBe(false);
  });

  it("deduplicates reused addresses", () => {
    const ctx = mockCtx({
      inputCount: 2,
      outputCount: 3,
      outputScriptTypes: ["p2wpkh", "p2wpkh", "p2wpkh"],
      outputValues: [20_000, 30_000, 40_000],
      prevouts: [prevout(SCRIPT_A), prevout(SCRIPT_A)],
      tx: {
        outputs: [
          { value: 20_000n, scriptPubKey: Buffer.from(SCRIPT_A, "hex") },
          { value: 30_000n, scriptPubKey: Buffer.from(SCRIPT_A, "hex") },
          { value: 40_000n, scriptPubKey: Buffer.from(SCRIPT_B, "hex") },
        ],
      },
    });
    const result = addressReuse.analyze(ctx);
    expect(result.detected).toBe(true);
    expect(result.reused_addresses!.length).toBe(1);
  });
});
