/**
 * Tests for RBF/locktime interaction matrix.
 *
 * The interaction between rbf, locktime, and current_height produces
 * five distinct nSequence/nLockTime combinations. These tests verify
 * each row of the matrix plus boundary conditions:
 *
 *   Row │ rbf   │ locktime │ height │ nSequence  │ nLockTime
 *   ────┼───────┼──────────┼────────┼────────────┼───────────
 *    1  │ —     │ —        │ —      │ 0xFFFFFFFF │ 0
 *    2  │ false │ yes      │ —      │ 0xFFFFFFFE │ locktime
 *    3  │ true  │ —        │ yes    │ 0xFFFFFFFD │ height
 *    4  │ true  │ yes      │ —      │ 0xFFFFFFFD │ locktime
 *    5  │ true  │ —        │ —      │ 0xFFFFFFFD │ 0
 *
 * BIP-65 locktime threshold: values < 500M are block heights,
 * values ≥ 500M are Unix timestamps. Both boundaries are tested.
 */

import { describe, it, expect } from "vitest";
import { computeRbfLocktime } from "../src/rbf-locktime.js";
import { makeFixture } from "./helpers.js";

describe("computeRbfLocktime", () => {
  // ── Matrix row 1: no rbf, no locktime ────────────────────────────

  it("row 1: defaults to final sequence and locktime 0", () => {
    const result = computeRbfLocktime(makeFixture({}));

    expect(result.nSequence).toBe(0xffffffff);
    expect(result.nLockTime).toBe(0);
    expect(result.rbfSignaling).toBe(false);
    expect(result.locktimeType).toBe("none");
  });

  // ── Matrix row 2: locktime without rbf ───────────────────────────

  it("row 2: enables locktime without RBF signaling", () => {
    const result = computeRbfLocktime(makeFixture({ locktime: 850_000 }));

    expect(result.nSequence).toBe(0xfffffffe);
    expect(result.nLockTime).toBe(850_000);
    expect(result.rbfSignaling).toBe(false);
    expect(result.locktimeType).toBe("block_height");
  });

  it("row 2: explicit rbf:false with locktime behaves like absent rbf", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: false, locktime: 900_000 }),
    );

    expect(result.nSequence).toBe(0xfffffffe);
    expect(result.nLockTime).toBe(900_000);
    expect(result.rbfSignaling).toBe(false);
    expect(result.locktimeType).toBe("block_height");
  });

  // ── Matrix row 3: rbf with anti-fee-sniping ──────────────────────

  it("row 3: rbf + current_height uses anti-fee-sniping locktime", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: true, current_height: 860_000 }),
    );

    expect(result.nSequence).toBe(0xfffffffd);
    expect(result.nLockTime).toBe(860_000);
    expect(result.rbfSignaling).toBe(true);
    expect(result.locktimeType).toBe("block_height");
  });

  // ── Matrix row 4: rbf with explicit locktime ─────────────────────

  it("row 4: rbf + explicit locktime uses the locktime value", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: true, locktime: 850_000 }),
    );

    expect(result.nSequence).toBe(0xfffffffd);
    expect(result.nLockTime).toBe(850_000);
    expect(result.rbfSignaling).toBe(true);
    expect(result.locktimeType).toBe("block_height");
  });

  it("row 4: explicit locktime takes priority over current_height", () => {
    const result = computeRbfLocktime(
      makeFixture({ rbf: true, locktime: 850_000, current_height: 860_000 }),
    );

    expect(result.nLockTime).toBe(850_000);
  });

  // ── Matrix row 5: rbf without locktime or height ─────────────────

  it("row 5: rbf alone signals RBF with locktime 0", () => {
    const result = computeRbfLocktime(makeFixture({ rbf: true }));

    expect(result.nSequence).toBe(0xfffffffd);
    expect(result.nLockTime).toBe(0);
    expect(result.rbfSignaling).toBe(true);
    expect(result.locktimeType).toBe("none");
  });

  // ── BIP-65 locktime type boundary ────────────────────────────────
  // Values < 500_000_000 are block heights, ≥ 500_000_000 are Unix timestamps.

  it("classifies locktime 499,999,999 as block_height (boundary)", () => {
    const result = computeRbfLocktime(makeFixture({ locktime: 499_999_999 }));

    expect(result.nLockTime).toBe(499_999_999);
    expect(result.locktimeType).toBe("block_height");
  });

  it("classifies locktime 500,000,000 as unix_timestamp (boundary)", () => {
    const result = computeRbfLocktime(makeFixture({ locktime: 500_000_000 }));

    expect(result.nLockTime).toBe(500_000_000);
    expect(result.locktimeType).toBe("unix_timestamp");
  });
});
