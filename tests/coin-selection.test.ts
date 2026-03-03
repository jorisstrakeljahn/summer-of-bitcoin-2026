import { describe, it, expect } from "vitest";
import { selectCoins } from "../src/coin-selection/index.js";
import { largestFirst } from "../src/coin-selection/largest-first.js";
import { InsufficientFundsError } from "../src/fee-calculator.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("largestFirst", () => {
  it("selects a single sufficient UTXO", () => {
    const result = largestFirst.select({
      utxos: [makeUtxo({ value_sats: 100_000 })],
      payments: [makePayment({ value_sats: 50_000 })],
      change: makeChange(),
      feeRate: 5,
    });

    expect(result).not.toBeNull();
    expect(result!.selectedUtxos).toHaveLength(1);
    expect(result!.strategyName).toBe("largest_first");
  });

  it("picks the largest UTXOs first", () => {
    const small = makeUtxo({ value_sats: 10_000 });
    const large = makeUtxo({ value_sats: 200_000 });
    const medium = makeUtxo({ value_sats: 50_000 });

    const result = largestFirst.select({
      utxos: [small, large, medium],
      payments: [makePayment({ value_sats: 100_000 })],
      change: makeChange(),
      feeRate: 2,
    });

    expect(result).not.toBeNull();
    expect(result!.selectedUtxos[0].value_sats).toBe(200_000);
  });

  it("adds more inputs when one is insufficient", () => {
    const result = largestFirst.select({
      utxos: [
        makeUtxo({ value_sats: 30_000 }),
        makeUtxo({ value_sats: 25_000 }),
        makeUtxo({ value_sats: 20_000 }),
      ],
      payments: [makePayment({ value_sats: 50_000 })],
      change: makeChange(),
      feeRate: 1,
    });

    expect(result).not.toBeNull();
    expect(result!.selectedUtxos.length).toBeGreaterThanOrEqual(2);
  });

  it("respects max_inputs limit", () => {
    const result = largestFirst.select({
      utxos: [
        makeUtxo({ value_sats: 20_000 }),
        makeUtxo({ value_sats: 20_000 }),
        makeUtxo({ value_sats: 20_000 }),
      ],
      payments: [makePayment({ value_sats: 50_000 })],
      change: makeChange(),
      feeRate: 1,
      maxInputs: 2,
    });

    expect(result).toBeNull();
  });

  it("returns null when funds are insufficient", () => {
    const result = largestFirst.select({
      utxos: [makeUtxo({ value_sats: 1_000 })],
      payments: [makePayment({ value_sats: 50_000 })],
      change: makeChange(),
      feeRate: 5,
    });

    expect(result).toBeNull();
  });

  it("handles send-all scenario within coin selection", () => {
    const result = largestFirst.select({
      utxos: [makeUtxo({ value_sats: 10_000 })],
      payments: [makePayment({ value_sats: 9_000 })],
      change: makeChange(),
      feeRate: 5,
    });

    expect(result).not.toBeNull();
    expect(result!.changeAmount).toBeNull();
  });
});

describe("selectCoins", () => {
  it("throws InsufficientFundsError when no strategy succeeds", () => {
    expect(() =>
      selectCoins({
        utxos: [makeUtxo({ value_sats: 500 })],
        payments: [makePayment({ value_sats: 50_000 })],
        change: makeChange(),
        feeRate: 5,
      }),
    ).toThrow(InsufficientFundsError);
  });

  it("returns the result with the lowest fee", () => {
    const result = selectCoins({
      utxos: [makeUtxo({ value_sats: 100_000 })],
      payments: [makePayment({ value_sats: 50_000 })],
      change: makeChange(),
      feeRate: 2,
    });

    expect(["largest_first", "lowest_fee", "branch_and_bound"]).toContain(result.strategyName);
    expect(result.fee).toBeGreaterThan(0);
  });
});
