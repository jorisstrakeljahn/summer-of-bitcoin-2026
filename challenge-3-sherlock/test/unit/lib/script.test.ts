import { describe, it, expect } from "vitest";
import {
  classifyOutputScript,
  classifyInputScript,
  parseOpReturnPayload,
} from "../../../src/lib/script.js";

describe("classifyOutputScript", () => {
  it("classifies P2PKH scripts", () => {
    // OP_DUP OP_HASH160 <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG
    const script = "76a914" + "ab".repeat(20) + "88ac";
    expect(classifyOutputScript(script)).toBe("p2pkh");
  });

  it("classifies P2SH scripts", () => {
    // OP_HASH160 <20-byte-hash> OP_EQUAL
    const script = "a914" + "ab".repeat(20) + "87";
    expect(classifyOutputScript(script)).toBe("p2sh");
  });

  it("classifies P2WPKH scripts", () => {
    // OP_0 <20-byte-hash>
    const script = "0014" + "ab".repeat(20);
    expect(classifyOutputScript(script)).toBe("p2wpkh");
  });

  it("classifies P2WSH scripts", () => {
    // OP_0 <32-byte-hash>
    const script = "0020" + "ab".repeat(32);
    expect(classifyOutputScript(script)).toBe("p2wsh");
  });

  it("classifies P2TR scripts", () => {
    // OP_1 <32-byte-key>
    const script = "5120" + "ab".repeat(32);
    expect(classifyOutputScript(script)).toBe("p2tr");
  });

  it("classifies OP_RETURN scripts", () => {
    const script = "6a0b68656c6c6f";
    expect(classifyOutputScript(script)).toBe("op_return");
  });

  it("returns unknown for non-standard scripts", () => {
    expect(classifyOutputScript("0000")).toBe("unknown");
    expect(classifyOutputScript("")).toBe("unknown");
  });
});

describe("classifyInputScript", () => {
  it("classifies P2PKH spend", () => {
    const prevout = "76a914" + "ab".repeat(20) + "88ac";
    expect(classifyInputScript(prevout, "00", [])).toBe("p2pkh");
  });

  it("classifies P2WPKH spend", () => {
    const prevout = "0014" + "ab".repeat(20);
    expect(classifyInputScript(prevout, "", ["sig", "pubkey"])).toBe("p2wpkh");
  });

  it("classifies P2TR keypath spend (1 witness element)", () => {
    const prevout = "5120" + "ab".repeat(32);
    expect(classifyInputScript(prevout, "", ["schnorr_sig"])).toBe("p2tr_keypath");
  });

  it("classifies P2TR scriptpath spend (2+ witness elements)", () => {
    const prevout = "5120" + "ab".repeat(32);
    expect(classifyInputScript(prevout, "", ["sig", "script", "control_block"])).toBe(
      "p2tr_scriptpath",
    );
  });

  it("classifies P2SH-P2WPKH spend", () => {
    const prevout = "a914" + "ab".repeat(20) + "87";
    const scriptSig = "16" + "0014" + "cc".repeat(20); // push 22 bytes: OP_0 <20-byte-hash>
    expect(classifyInputScript(prevout, scriptSig, ["sig", "pubkey"])).toBe("p2sh-p2wpkh");
  });
});

describe("parseOpReturnPayload", () => {
  it("parses simple OP_RETURN data", () => {
    // OP_RETURN PUSH(5) "hello"
    const script = "6a0568656c6c6f";
    const result = parseOpReturnPayload(script);
    expect(result.op_return_data_utf8).toBe("hello");
    expect(result.op_return_protocol).toBe("unknown");
  });

  it("detects Omni Layer protocol", () => {
    const omniPayload = "6f6d6e69" + "00".repeat(16);
    const script = "6a14" + omniPayload;
    const result = parseOpReturnPayload(script);
    expect(result.op_return_protocol).toBe("omni");
  });

  it("returns empty for non-OP_RETURN scripts", () => {
    const result = parseOpReturnPayload("0014" + "ab".repeat(20));
    expect(result.op_return_data_hex).toBe("");
    expect(result.op_return_protocol).toBe("unknown");
  });
});
