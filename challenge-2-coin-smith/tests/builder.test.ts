/**
 * End-to-end integration tests for the build pipeline.
 *
 * These tests exercise the full path from raw fixture JSON to
 * final build report, verifying that all pipeline stages
 * (validate → select → resolve → build → warn → report) produce
 * correct results when composed together.
 *
 * Key invariants:
 *   - Report contains all required fields per the challenge spec
 *   - Balance equation: sum(inputs) = sum(outputs) + fee
 *   - Reported fee rate matches actual fee/vbytes ratio
 *   - change_index is consistent with the outputs array
 *   - PSBT base64 starts with magic bytes (70736274ff)
 *   - Invalid inputs produce structured error objects (not crashes)
 */

import { describe, it, expect } from "vitest";
import { build } from "../src/builder.js";

function validRawFixture(): Record<string, unknown> {
  return {
    network: "mainnet",
    utxos: [
      {
        txid: "aa".repeat(32),
        vout: 0,
        value_sats: 100_000,
        script_pubkey_hex: "0014" + "cc".repeat(20),
        script_type: "p2wpkh",
        address: "bc1qtest",
      },
    ],
    payments: [
      {
        address: "bc1qpay",
        script_pubkey_hex: "0014" + "dd".repeat(20),
        script_type: "p2wpkh",
        value_sats: 50_000,
      },
    ],
    change: {
      address: "bc1qchange",
      script_pubkey_hex: "0014" + "ee".repeat(20),
      script_type: "p2wpkh",
    },
    fee_rate_sat_vb: 5,
  };
}

describe("build (integration)", () => {
  // ── Report completeness ──────────────────────────────────────────

  it("produces a report containing all required fields", () => {
    const result = build(validRawFixture());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const requiredKeys = [
      "ok", "network", "strategy", "selected_inputs", "outputs",
      "change_index", "fee_sats", "fee_rate_sat_vb", "vbytes",
      "rbf_signaling", "locktime", "locktime_type", "psbt_base64", "warnings",
    ];
    for (const key of requiredKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  // ── Core invariants ──────────────────────────────────────────────

  it("maintains balance: sum(inputs) = sum(outputs) + fee", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    const inputSum = result.selected_inputs.reduce((s, i) => s + i.value_sats, 0);
    const outputSum = result.outputs.reduce((s, o) => s + o.value_sats, 0);

    expect(inputSum).toBe(outputSum + result.fee_sats);
  });

  it("reports fee rate consistent with fee / vbytes (±0.01)", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    const actualRate = result.fee_sats / result.vbytes;
    expect(Math.abs(actualRate - result.fee_rate_sat_vb)).toBeLessThanOrEqual(0.01);
  });

  it("change_index points to the correct is_change output", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    if (result.change_index !== null) {
      expect(result.outputs[result.change_index].is_change).toBe(true);
    } else {
      expect(result.outputs.every((o) => !o.is_change)).toBe(true);
    }
  });

  // ── PSBT output ──────────────────────────────────────────────────

  it("produces valid PSBT base64 with correct magic bytes", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    const raw = Buffer.from(result.psbt_base64, "base64");
    expect(raw.subarray(0, 5).toString("hex")).toBe("70736274ff");
  });

  // ── RBF and locktime end-to-end ──────────────────────────────────

  it("propagates rbf and locktime through the full pipeline", () => {
    const raw = validRawFixture();
    raw.rbf = true;
    raw.locktime = 850_000;

    const result = build(raw);
    if (!result.ok) throw new Error("Expected success");

    expect(result.rbf_signaling).toBe(true);
    expect(result.locktime).toBe(850_000);
    expect(result.locktime_type).toBe("block_height");
    expect(result.warnings).toContainEqual({ code: "RBF_SIGNALING" });
  });

  // ── Error handling ───────────────────────────────────────────────

  it("returns structured error for invalid fixture input", () => {
    const result = build({ invalid: true });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBeTruthy();
    expect(result.error.message).toBeTruthy();
  });

  it("returns INSUFFICIENT_FUNDS when inputs cannot cover payments", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].value_sats = 100;
    (raw.payments as Record<string, unknown>[])[0].value_sats = 50_000;

    const result = build(raw);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INSUFFICIENT_FUNDS");
  });
});
