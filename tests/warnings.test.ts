import { describe, it, expect } from "vitest";
import { detectWarnings } from "../src/warnings.js";

describe("detectWarnings", () => {
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

  it("does not emit HIGH_FEE below both thresholds", () => {
    const warnings = detectWarnings({
      feeSats: 999_999,
      feeRateSatVb: 199,
      changeAmount: 5_000,
      rbfSignaling: false,
    });

    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("HIGH_FEE");
  });

  it("emits SEND_ALL when no change output exists", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: null,
      rbfSignaling: false,
    });

    expect(warnings).toContainEqual({ code: "SEND_ALL" });
  });

  it("does not emit SEND_ALL when change exists", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: 10_000,
      rbfSignaling: false,
    });

    const codes = warnings.map((w) => w.code);
    expect(codes).not.toContain("SEND_ALL");
  });

  it("emits RBF_SIGNALING when rbf is active", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: 10_000,
      rbfSignaling: true,
    });

    expect(warnings).toContainEqual({ code: "RBF_SIGNALING" });
  });

  it("emits DUST_CHANGE as safety net when change < 546", () => {
    const warnings = detectWarnings({
      feeSats: 500,
      feeRateSatVb: 5,
      changeAmount: 545,
      rbfSignaling: false,
    });

    expect(warnings).toContainEqual({ code: "DUST_CHANGE" });
  });

  it("emits multiple warnings simultaneously", () => {
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
