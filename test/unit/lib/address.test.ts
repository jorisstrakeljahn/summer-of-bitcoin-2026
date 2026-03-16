import { describe, it, expect } from "vitest";
import { deriveAddress } from "../../../src/lib/address.js";

describe("deriveAddress", () => {
  it("derives P2PKH address (mainnet)", () => {
    // Known P2PKH scriptPubKey with hash 0000...0001
    const hash = "00".repeat(19) + "01";
    const script = "76a914" + hash + "88ac";
    const address = deriveAddress(script, "p2pkh", "mainnet");
    expect(address).toBeDefined();
    expect(address!.startsWith("1")).toBe(true);
  });

  it("derives P2SH address (mainnet)", () => {
    const hash = "00".repeat(19) + "01";
    const script = "a914" + hash + "87";
    const address = deriveAddress(script, "p2sh", "mainnet");
    expect(address).toBeDefined();
    expect(address!.startsWith("3")).toBe(true);
  });

  it("derives P2WPKH address (mainnet)", () => {
    const hash = "00".repeat(20);
    const script = "0014" + hash;
    const address = deriveAddress(script, "p2wpkh", "mainnet");
    expect(address).toBeDefined();
    expect(address!.startsWith("bc1q")).toBe(true);
  });

  it("derives P2WSH address (mainnet)", () => {
    const hash = "00".repeat(32);
    const script = "0020" + hash;
    const address = deriveAddress(script, "p2wsh", "mainnet");
    expect(address).toBeDefined();
    expect(address!.startsWith("bc1q")).toBe(true);
  });

  it("derives P2TR address (mainnet, bech32m)", () => {
    const key = "00".repeat(32);
    const script = "5120" + key;
    const address = deriveAddress(script, "p2tr", "mainnet");
    expect(address).toBeDefined();
    expect(address!.startsWith("bc1p")).toBe(true);
  });

  it("returns null for OP_RETURN", () => {
    expect(deriveAddress("6a0568656c6c6f", "op_return", "mainnet")).toBeNull();
  });

  it("returns null for unknown script type", () => {
    expect(deriveAddress("0000", "unknown", "mainnet")).toBeNull();
  });

  it("returns null for unsupported network", () => {
    const script = "0014" + "00".repeat(20);
    expect(deriveAddress(script, "p2wpkh", "invalid_net")).toBeNull();
  });

  it("derives testnet P2WPKH address", () => {
    const hash = "00".repeat(20);
    const script = "0014" + hash;
    const address = deriveAddress(script, "p2wpkh", "testnet");
    expect(address).toBeDefined();
    expect(address!.startsWith("tb1q")).toBe(true);
  });
});
