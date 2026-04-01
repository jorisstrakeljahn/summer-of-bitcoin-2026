/**
 * Tests for transaction safety warnings.
 *
 * The warning system flags potentially dangerous or noteworthy
 * conditions in a built transaction. Each warning has a distinct
 * trigger:
 *
 *   HIGH_FEE       — fee > 1M sats OR fee rate > 200 sat/vB
 *   SEND_ALL       — no change output (all excess goes to fee)
 *   RBF_SIGNALING  — BIP-125 replacement enabled
 *   DUST_CHANGE    — change < 546 sats (safety net, should not
 *                    normally trigger since the fee calculator
 *                    drops dust change to send-all)
 *
 * Multiple warnings can fire simultaneously.
 */

import { describe, it, expect } from "vitest";
import { detectWarnings } from "../src/warnings.js";

describe("detectWarnings", () => {
  // ── HIGH_FEE ─────────────────────────────────────────────────────

  it("emits HIGH_FEE when absolute fee exceeds 1M sats", () => {
    const warnings = detectWarnings({
      feeSats: 1_000_001,
      feeRateSatVb: 10,
      changeAmount: 5_000,
      rbfSignaling: false,
    });

    expect(warnings).toContainEqual({ code: "HIGH_FEE" });
  });

  it("emits HIGH_FEE when fee rate exceeds 200 sat/vB", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 201,
      changeAmount: 5_000,
      rbfSignaling: false,
    });

    expect(warnings).toContainEqual({ code: "HIGH_FEE" });
  });

  it("does not emit HIGH_FEE when both thresholds are below limits", () => {
    const warnings = detectWarnings({
      feeSats: 999_999,
      feeRateSatVb: 199,
      changeAmount: 5_000,
      rbfSignaling: false,
    });

    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("HIGH_FEE");
  });

  // ── SEND_ALL ─────────────────────────────────────────────────────

  it("emits SEND_ALL when no change output exists", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: null,
      rbfSignaling: false,
    });

    expect(warnings).toContainEqual({ code: "SEND_ALL" });
  });

  it("does not emit SEND_ALL when change output exists", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: 10_000,
      rbfSignaling: false,
    });

    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("SEND_ALL");
  });

  // ── RBF_SIGNALING ────────────────────────────────────────────────

  it("emits RBF_SIGNALING when BIP-125 replacement is active", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: 10_000,
      rbfSignaling: true,
    });

    expect(warnings).toContainEqual({ code: "RBF_SIGNALING" });
  });

  // ── DUST_CHANGE ──────────────────────────────────────────────────

  it("emits DUST_CHANGE as safety net when change < 546 sats", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: 545,
      rbfSignaling: false,
    });

    expect(warnings).toContainEqual({ code: "DUST_CHANGE" });
  });

  // ── Multiple warnings simultaneously ─────────────────────────────

  it("emits multiple warnings when several conditions are met", () => {
    const warnings = detectWarnings({
      feeSats: 2_000_000,
      feeRateSatVb: 300,
      changeAmount: null,
      rbfSignaling: true,
    });

    const codes = warnings.map((w) => w.code);
    expect(codes).toContain("HIGH_FEE");
    expect(codes).toContain("SEND_ALL");
    expect(codes).toContain("RBF_SIGNALING");
  });
});
