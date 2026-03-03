import { describe, it, expect } from "vitest";
import { buildPsbt } from "../src/psbt-builder.js";
import { makeUtxo, makePayment, makeChange } from "./helpers.js";

describe("buildPsbt", () => {
  it("produces valid PSBT magic bytes (70736274ff)", () => {
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

  it("appends change output with correct is_change flag", () => {
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

  it("assigns sequential n values to all outputs", () => {
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

  it("produces a valid base64 string", () => {
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
});
