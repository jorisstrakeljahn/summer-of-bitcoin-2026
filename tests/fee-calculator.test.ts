import { describe, it, expect } from "vitest";
import { calculateFeeAndChange, InsufficientFundsError } from "../src/fee-calculator.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("calculateFeeAndChange", () => {
  it("creates change output when remainder exceeds dust threshold", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 100_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 70_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 5);

    expect(result.changeAmount).not.toBeNull();
    expect(result.changeAmount!).toBeGreaterThanOrEqual(546);
    expect(result.fee).toBe(Math.ceil(result.vbytes * 5));
  });

  it("drops change to send-all when change would be dust", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 10_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 9_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 5);

    expect(result.changeAmount).toBeNull();
    expect(result.fee).toBe(1_000);
  });

  it("creates change at exactly the dust threshold (546 sats)", () => {
    // p2wpkh: vbytes_with_change = ceil(10.5 + 68 + 31 + 31) = 141
    // fee at rate 1 = ceil(141 * 1) = 141
    // change = inputs - payments - 141 = 546 → inputs - payments = 687
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 50_687 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 50_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 1);

    expect(result.changeAmount).toBe(546);
  });

  it("drops change at one below dust threshold (545 sats)", () => {
    // change would be 686 - 141 = 545 (dust) → send-all
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 50_686 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 50_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 1);

    expect(result.changeAmount).toBeNull();
    expect(result.fee).toBe(686);
  });

  it("throws InsufficientFundsError when inputs cannot cover payments + fee", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 1_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 999 })];
    const change = makeChange({ script_type: "p2wpkh" });

    expect(() => calculateFeeAndChange(inputs, payments, change, 5))
      .toThrow(InsufficientFundsError);
  });

  it("maintains balance equation: inputs = outputs + fee", () => {
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

  it("uses minimum fee when change exists (does not burn sats)", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh", value_sats: 100_000 })];
    const payments = [makePayment({ script_type: "p2wpkh", value_sats: 50_000 })];
    const change = makeChange({ script_type: "p2wpkh" });

    const result = calculateFeeAndChange(inputs, payments, change, 2);

    expect(result.changeAmount).not.toBeNull();
    expect(result.fee).toBe(Math.ceil(result.vbytes * 2));
  });
});
