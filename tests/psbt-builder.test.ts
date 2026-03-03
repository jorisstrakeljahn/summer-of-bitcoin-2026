/**
 * Tests for BIP-174 PSBT construction.
 *
 * Verifies that the PSBT builder produces structurally correct
 * Partially Signed Bitcoin Transactions. Key checks:
 *   - Magic bytes (70736274ff) identify the binary as a valid PSBT
 *   - Payment outputs appear without change flag
 *   - Change output appears with is_change = true
 *   - Output indices (n) are sequential starting at 0
 *   - Base64 encoding is valid and non-empty
 */

import { describe, it, expect } from "vitest";
import { buildPsbt } from "../src/psbt-builder.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("buildPsbt", () => {
  // ── BIP-174 format compliance ────────────────────────────────────

  it("produces PSBT with correct magic bytes (70736274ff)", () => {
    const { psbtBase64 } = buildPsbt({
      network: "mainnet",
      selectedInputs: [makeUtxo()],
      payments: [makePayment()],
      change: null,
      changeAmount: null,
      nSequence: 0xffffffff,
      nLockTime: 0,
    });

    const raw = Buffer.from(psbtBase64, "base64");
    const magic = raw.subarray(0, 5).toString("hex");
    expect(magic).toBe("70736274ff");
  });

  it("produces valid non-empty base64 encoding", () => {
    const { psbtBase64 } = buildPsbt({
      network: "mainnet",
      selectedInputs: [makeUtxo()],
      payments: [makePayment()],
      change: null,
      changeAmount: null,
      nSequence: 0xffffffff,
      nLockTime: 0,
    });

    expect(() => Buffer.from(psbtBase64, "base64")).not.toThrow();
    expect(psbtBase64.length).toBeGreaterThan(0);
  });

  // ── Output structure ─────────────────────────────────────────────

  it("includes all payment outputs without change flag", () => {
    const { outputs } = buildPsbt({
      network: "mainnet",
      selectedInputs: [makeUtxo({ value_sats: 200_000 })],
      payments: [
        makePayment({ value_sats: 30_000 }),
        makePayment({ value_sats: 20_000 }),
      ],
      change: null,
      changeAmount: null,
      nSequence: 0xffffffff,
      nLockTime: 0,
    });

    expect(outputs).toHaveLength(2);
    expect(outputs.every((o) => !o.is_change)).toBe(true);
  });

  it("appends change output with is_change flag and correct value", () => {
    const change = makeChange();
    const { outputs } = buildPsbt({
      network: "mainnet",
      selectedInputs: [makeUtxo()],
      payments: [makePayment()],
      change,
      changeAmount: 10_000,
      nSequence: 0xffffffff,
      nLockTime: 0,
    });

    expect(outputs).toHaveLength(2);
    expect(outputs[1].is_change).toBe(true);
    expect(outputs[1].value_sats).toBe(10_000);
  });

  it("assigns sequential output indices (n = 0, 1, 2, ...)", () => {
    const { outputs } = buildPsbt({
      network: "mainnet",
      selectedInputs: [makeUtxo()],
      payments: [makePayment(), makePayment()],
      change: makeChange(),
      changeAmount: 5_000,
      nSequence: 0xffffffff,
      nLockTime: 0,
    });

    expect(outputs.map((o) => o.n)).toEqual([0, 1, 2]);
  });
});
