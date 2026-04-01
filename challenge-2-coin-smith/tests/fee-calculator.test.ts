/**
 * Tests for two-pass fee and change calculation.
 *
 * The fee calculator must handle the circular dependency between
 * change output presence and transaction size. These tests verify:
 *   - Pass 1: change created when remainder ≥ 546 (dust threshold)
 *   - Pass 2: send-all fallback when change would be dust
 *   - Boundary: exact dust threshold (546 = change, 545 = send-all)
 *   - Invariant: inputs = outputs + fee always holds
 *   - Safety: fee is the minimum required (no burned sats with change)
 *   - Error: InsufficientFundsError when inputs can't cover payments
 */

import { describe, it, expect } from "vitest";
import { calculateFeeAndChange, InsufficientFundsError } from "../src/fee-calculator.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("calculateFeeAndChange", () => {
  // ── Pass 1: change output created ────────────────────────────────

  it("creates change output when remainder exceeds dust threshold", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 100_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 70_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 5);

    expect(result.changeAmount).not.toBeNull();
    expect(result.changeAmount!).toBeGreaterThanOrEqual(546);
    expect(result.fee).toBe(Math.ceil(result.vbytes * 5));
  });

  it("uses minimum fee when change exists (no burned sats)", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 100_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 50_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 2);

    expect(result.changeAmount).not.toBeNull();
    expect(result.fee).toBe(Math.ceil(result.vbytes * 2));
  });

  // ── Pass 2: send-all fallback ────────────────────────────────────

  it("drops to send-all when change would be dust", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 10_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 9_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 5);

    expect(result.changeAmount).toBeNull();
    expect(result.fee).toBe(1_000);
  });

  // ── Dust threshold boundary ──────────────────────────────────────

  it("creates change at exactly 546 sats (minimum non-dust)", () => {
    // vbytes_with_change = ceil(10.5 + 68 + 31 + 31) = 141
    // fee at rate 1 = 141, so inputs - payments must be 141 + 546 = 687
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 50_687 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 50_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 1);

    expect(result.changeAmount).toBe(546);
  });

  it("drops change at 545 sats (one below dust threshold)", () => {
    // change would be 686 - 141 = 545 → dust → send-all with fee = 686
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 50_686 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 50_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 1);

    expect(result.changeAmount).toBeNull();
    expect(result.fee).toBe(686);
  });

  // ── Invariant: balance equation ──────────────────────────────────

  it("maintains balance: sum(inputs) = sum(outputs) + fee", () => {
    const inputs = [
      makeUtxo({ script_type: "p2wpkh", value_sats: 200_000 }),
      makeUtxo({ script_type: "p2tr", value_sats: 150_000 }),
    ];
    const payments = [
      makePayment({ script_type: "p2wpkh", value_sats: 100_000 }),
      makePayment({ script_type: "p2tr", value_sats: 80_000 }),
    ];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 3);

    const inputSum = 200_000 + 150_000;
    const outputSum = 100_000 + 80_000 + (result.changeAmount ?? 0);
    expect(inputSum).toBe(outputSum + result.fee);
  });

  // ── Insufficient funds ───────────────────────────────────────────

  it("throws InsufficientFundsError when inputs cannot cover payments + fee", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 1_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 999 })];
    const change = makeChange({ script_type: "p2wpkh" });

    expect(() => calculateFeeAndChange(inputs, payments, change, 5))
      .toThrow(InsufficientFundsError);
  });
});
