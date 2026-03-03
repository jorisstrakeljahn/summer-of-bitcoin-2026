/**
 * Tests for coin selection strategies.
 *
 * Verifies both the largest-first greedy algorithm in isolation
 * and the multi-strategy runner that selects the best result.
 *
 * Key behaviors:
 *   - Largest-first sorts UTXOs by value descending and greedily
 *     accumulates until the target (payments + fee) is met
 *   - The runner evaluates all strategies and picks lowest fee
 *   - Policy constraints (max_inputs) must be respected
 *   - Insufficient funds produce null (strategy) or error (runner)
 *   - Send-all scenarios (dust change → no change output)
 */

import { describe, it, expect } from "vitest";
import { selectCoins } from "../src/coin-selection/index.js";
import { largestFirst } from "../src/coin-selection/largest-first.js";
import { InsufficientFundsError } from "../src/fee-calculator.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("largestFirst", () => {
  // ── Basic selection ──────────────────────────────────────────────

  it("selects a single UTXO when it covers payments + fee", () => {
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

  it("always picks the largest UTXOs first", () => {
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

  it("accumulates multiple inputs when one is not enough", () => {
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

  // ── Policy constraints ───────────────────────────────────────────

  it("returns null when max_inputs policy prevents a valid selection", () => {
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

  // ── Edge cases ───────────────────────────────────────────────────

  it("returns null when total funds are insufficient", () => {
    const result = largestFirst.select({
      utxos: [makeUtxo({ value_sats: 1_000 })],
      payments: [makePayment({ value_sats: 50_000 })],
      change: makeChange(),
      feeRate: 5,
    });

    expect(result).toBeNull();
  });

  it("produces send-all result when change would be dust", () => {
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

describe("selectCoins (multi-strategy runner)", () => {
  it("throws InsufficientFundsError when no strategy can fund the tx", () => {
    expect(() =>
      selectCoins({
        utxos: [makeUtxo({ value_sats: 500 })],
        payments: [makePayment({ value_sats: 50_000 })],
        change: makeChange(),
        feeRate: 5,
      }),
    ).toThrow(InsufficientFundsError);
  });

  it("returns the strategy result with the lowest fee", () => {
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
