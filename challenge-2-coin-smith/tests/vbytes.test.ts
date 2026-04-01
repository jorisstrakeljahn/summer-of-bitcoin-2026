/**
 * Tests for BIP-141 weight estimation.
 *
 * Verifies that per-input and per-output vbyte values match the
 * expected BIP-141 weight calculations, and that total transaction
 * size estimation correctly handles:
 *   - SegWit vs legacy overhead (10.5 vs 10 vB)
 *   - Mixed input types (one SegWit input triggers witness overhead)
 *   - Fractional vbytes from Taproot (57.5 → ceiled in total)
 *   - Optional change output in size estimate
 */

import { describe, it, expect } from "vitest";
import { inputVbytes, outputVbytes, estimateVbytes, isSegwit } from "../src/vbytes.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("inputVbytes", () => {
  it("returns BIP-141 standard vbytes for each script type", () => {
    expect(inputVbytes("p2pkh")).toBe(148);
    expect(inputVbytes("p2sh")).toBe(256);
    expect(inputVbytes("p2sh-p2wpkh")).toBe(91);
    expect(inputVbytes("p2wpkh")).toBe(68);
    expect(inputVbytes("p2wsh")).toBe(104);
    expect(inputVbytes("p2tr")).toBe(57.5);
  });
});

describe("outputVbytes", () => {
  it("returns standard output sizes for each script type", () => {
    expect(outputVbytes("p2pkh")).toBe(34);
    expect(outputVbytes("p2sh")).toBe(32);
    expect(outputVbytes("p2sh-p2wpkh")).toBe(32);
    expect(outputVbytes("p2wpkh")).toBe(31);
    expect(outputVbytes("p2wsh")).toBe(43);
    expect(outputVbytes("p2tr")).toBe(43);
  });
});

describe("isSegwit", () => {
  it("identifies SegWit v0 and v1 types as segwit", () => {
    expect(isSegwit("p2wpkh")).toBe(true);
    expect(isSegwit("p2sh-p2wpkh")).toBe(true);
    expect(isSegwit("p2wsh")).toBe(true);
    expect(isSegwit("p2tr")).toBe(true);
  });

  it("identifies legacy types as non-segwit", () => {
    expect(isSegwit("p2pkh")).toBe(false);
    expect(isSegwit("p2sh")).toBe(false);
  });
});

describe("estimateVbytes", () => {
  it("uses 10.5 vB SegWit overhead when any input is SegWit", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh" })];
    const payments = [makePayment({ script_type: "p2wpkh" })];
    // ceil(10.5 + 68 + 31) = ceil(109.5) = 110
    expect(estimateVbytes(inputs, payments, null)).toBe(110);
  });

  it("uses 10 vB overhead for pure legacy transactions", () => {
    const inputs = [makeUtxo({ script_type: "p2pkh" })];
    const payments = [makePayment({ script_type: "p2pkh" })];
    // ceil(10 + 148 + 34) = 192
    expect(estimateVbytes(inputs, payments, null)).toBe(192);
  });

  it("adds change output vbytes to the estimate", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh" })];
    const payments = [makePayment({ script_type: "p2wpkh" })];
    const change = makeChange({ script_type: "p2wpkh" });
    // ceil(10.5 + 68 + 31 + 31) = ceil(140.5) = 141
    expect(estimateVbytes(inputs, payments, change)).toBe(141);
  });

  it("enables SegWit overhead when mixing legacy and SegWit inputs", () => {
    const inputs = [
      makeUtxo({ script_type: "p2pkh" }),
      makeUtxo({ script_type: "p2wpkh" }),
    ];
    const payments = [makePayment({ script_type: "p2wpkh" })];
    // One SegWit input → 10.5 overhead applies to entire transaction
    // ceil(10.5 + 148 + 68 + 31) = ceil(257.5) = 258
    expect(estimateVbytes(inputs, payments, null)).toBe(258);
  });

  it("correctly ceils fractional Taproot vbytes in total", () => {
    const inputs = [makeUtxo({ script_type: "p2tr" })];
    const payments = [makePayment({ script_type: "p2tr" })];
    // ceil(10.5 + 57.5 + 43) = ceil(111.0) = 111
    expect(estimateVbytes(inputs, payments, null)).toBe(111);
  });
});
