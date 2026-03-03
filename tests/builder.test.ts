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

describe("build", () => {
  it("produces a successful report with all required fields", () => {
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

  it("maintains balance equation: inputs = outputs + fee", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    const inputSum = result.selected_inputs.reduce((s, i) => s + i.value_sats, 0);
    const outputSum = result.outputs.reduce((s, o) => s + o.value_sats, 0);

    expect(inputSum).toBe(outputSum + result.fee_sats);
  });

  it("reports fee rate within ±0.01 tolerance of fee/vbytes", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    const actualRate = result.fee_sats / result.vbytes;
    expect(Math.abs(actualRate - result.fee_rate_sat_vb)).toBeLessThanOrEqual(0.01);
  });

  it("sets change_index consistently with outputs array", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    if (result.change_index !== null) {
      expect(result.outputs[result.change_index].is_change).toBe(true);
    } else {
      expect(result.outputs.every((o) => !o.is_change)).toBe(true);
    }
  });

  it("returns structured error for invalid fixtures", () => {
    const result = build({ invalid: true });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBeTruthy();
    expect(result.error.message).toBeTruthy();
  });

  it("returns INSUFFICIENT_FUNDS error when inputs are too small", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].value_sats = 100;
    (raw.payments as Record<string, unknown>[])[0].value_sats = 50_000;

    const result = build(raw);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("produces valid PSBT base64 with correct magic bytes", () => {
    const result = build(validRawFixture());
    if (!result.ok) throw new Error("Expected success");

    const raw = Buffer.from(result.psbt_base64, "base64");
    expect(raw.subarray(0, 5).toString("hex")).toBe("70736274ff");
  });

  it("handles rbf and locktime fields end-to-end", () => {
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
});
