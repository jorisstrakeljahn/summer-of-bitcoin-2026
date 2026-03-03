import { describe, it, expect } from "vitest";
import { inputVbytes, outputVbytes, estimateVbytes, isSegwit } from "../src/vbytes.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("inputVbytes", () => {
  it("returns correct vbytes for each script type", () => {
    expect(inputVbytes("p2pkh")).toBe(148);
    expect(inputVbytes("p2sh")).toBe(256);
    expect(inputVbytes("p2sh-p2wpkh")).toBe(91);
    expect(inputVbytes("p2wpkh")).toBe(68);
    expect(inputVbytes("p2wsh")).toBe(104);
    expect(inputVbytes("p2tr")).toBe(57.5);
  });
});

describe("outputVbytes", () => {
  it("returns correct vbytes for each script type", () => {
    expect(outputVbytes("p2pkh")).toBe(34);
    expect(outputVbytes("p2sh")).toBe(32);
    expect(outputVbytes("p2sh-p2wpkh")).toBe(32);
    expect(outputVbytes("p2wpkh")).toBe(31);
    expect(outputVbytes("p2wsh")).toBe(43);
    expect(outputVbytes("p2tr")).toBe(43);
  });
});

describe("isSegwit", () => {
  it("identifies segwit types correctly", () => {
    expect(isSegwit("p2wpkh")).toBe(true);
    expect(isSegwit("p2sh-p2wpkh")).toBe(true);
    expect(isSegwit("p2wsh")).toBe(true);
    expect(isSegwit("p2tr")).toBe(true);
  });

  it("identifies non-segwit types correctly", () => {
    expect(isSegwit("p2pkh")).toBe(false);
    expect(isSegwit("p2sh")).toBe(false);
  });
});

describe("estimateVbytes", () => {
  it("uses 10.5 vB segwit overhead when any input is segwit", () => {
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

  it("includes change output in size estimation", () => {
    const inputs = [makeUtxo({ script_type: "p2wpkh" })];
    const payments = [makePayment({ script_type: "p2wpkh" })];
    const change = makeChange({ script_type: "p2wpkh" });
    // ceil(10.5 + 68 + 31 + 31) = ceil(140.5) = 141
    expect(estimateVbytes(inputs, payments, change)).toBe(141);
  });

  it("detects segwit overhead with mixed input types", () => {
    const inputs = [
      makeUtxo({ script_type: "p2pkh" }),
      makeUtxo({ script_type: "p2wpkh" }),
    ];
    const payments = [makePayment({ script_type: "p2wpkh" })];
    // ceil(10.5 + 148 + 68 + 31) = ceil(257.5) = 258
    expect(estimateVbytes(inputs, payments, null)).toBe(258);
  });

  it("handles taproot inputs with fractional vbytes", () => {
    const inputs = [makeUtxo({ script_type: "p2tr" })];
    const payments = [makePayment({ script_type: "p2tr" })];
    // ceil(10.5 + 57.5 + 43) = ceil(111) = 111
    expect(estimateVbytes(inputs, payments, null)).toBe(111);
  });
});
