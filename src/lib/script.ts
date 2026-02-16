/**
 * Bitcoin script classification and disassembly.
 *
 * - Classifies output scripts (scriptPubKey) into standard types
 * - Classifies input spend types based on prevout + scriptSig + witness
 * - Disassembles scripts into human-readable ASM format
 */

import type { OutputScriptType, InputScriptType } from "./types.js";

// ---------------------------------------------------------------------------
// Output Script Classification
// ---------------------------------------------------------------------------

export function classifyOutputScript(scriptPubKeyHex: string): OutputScriptType {
  const len = scriptPubKeyHex.length / 2; // byte length

  // P2PKH: OP_DUP OP_HASH160 <20> OP_EQUALVERIFY OP_CHECKSIG
  // Pattern: 76a914{40hex}88ac (25 bytes)
  if (len === 25 && scriptPubKeyHex.startsWith("76a914") && scriptPubKeyHex.endsWith("88ac")) {
    return "p2pkh";
  }

  // P2SH: OP_HASH160 <20> OP_EQUAL
  // Pattern: a914{40hex}87 (23 bytes)
  if (len === 23 && scriptPubKeyHex.startsWith("a914") && scriptPubKeyHex.endsWith("87")) {
    return "p2sh";
  }

  // P2WPKH: OP_0 <20>
  // Pattern: 0014{40hex} (22 bytes)
  if (len === 22 && scriptPubKeyHex.startsWith("0014")) {
    return "p2wpkh";
  }

  // P2WSH: OP_0 <32>
  // Pattern: 0020{64hex} (34 bytes)
  if (len === 34 && scriptPubKeyHex.startsWith("0020")) {
    return "p2wsh";
  }

  // P2TR: OP_1 <32>
  // Pattern: 5120{64hex} (34 bytes)
  if (len === 34 && scriptPubKeyHex.startsWith("5120")) {
    return "p2tr";
  }

  // OP_RETURN
  if (scriptPubKeyHex.startsWith("6a")) {
    return "op_return";
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// Input Script Classification
// ---------------------------------------------------------------------------

export function classifyInputScript(
  _prevoutScriptPubKeyHex: string,
  _scriptSigHex: string,
  _witness: string[],
): InputScriptType {
  // TODO: Implement input classification logic
  // Based on prevout type + scriptSig + witness
  return "unknown";
}

// ---------------------------------------------------------------------------
// Script Disassembly
// ---------------------------------------------------------------------------

export function disassembleScript(_scriptHex: string): string {
  // TODO: Implement script disassembly
  // Uses bitcoin-ops for opcode name lookup
  return "";
}

// ---------------------------------------------------------------------------
// OP_RETURN Payload Parsing
// ---------------------------------------------------------------------------

export interface OpReturnData {
  op_return_data_hex: string;
  op_return_data_utf8: string | null;
  op_return_protocol: string;
}

export function parseOpReturnPayload(_scriptPubKeyHex: string): OpReturnData {
  // TODO: Implement OP_RETURN payload extraction
  return {
    op_return_data_hex: "",
    op_return_data_utf8: null,
    op_return_protocol: "unknown",
  };
}
