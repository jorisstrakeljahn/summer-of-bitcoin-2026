/**
 * Bitcoin script classification, disassembly, and OP_RETURN parsing.
 */

import type { OutputScriptType, InputScriptType } from "./types.js";

export function classifyOutputScript(scriptHex: string): OutputScriptType {
  const len = scriptHex.length / 2;

  if (len === 25 && scriptHex.startsWith("76a914") && scriptHex.endsWith("88ac")) return "p2pkh";
  if (len === 23 && scriptHex.startsWith("a914") && scriptHex.endsWith("87")) return "p2sh";
  if (len === 22 && scriptHex.startsWith("0014")) return "p2wpkh";
  if (len === 34 && scriptHex.startsWith("0020")) return "p2wsh";
  if (len === 34 && scriptHex.startsWith("5120")) return "p2tr";
  if (scriptHex.startsWith("6a")) return "op_return";

  return "unknown";
}

export function classifyInputScript(
  prevoutScriptHex: string,
  scriptSigHex: string,
  witness: string[],
): InputScriptType {
  const prevoutType = classifyOutputScript(prevoutScriptHex);

  switch (prevoutType) {
    case "p2pkh":
      return "p2pkh";
    case "p2wpkh":
      return "p2wpkh";
    case "p2wsh":
      return "p2wsh";
    case "p2tr":
      return classifyTaprootSpend(witness);
    case "p2sh":
      return classifyP2shInput(scriptSigHex, witness);
    default:
      return "unknown";
  }
}

/**
 * BIP341 Taproot spend classification:
 *   - 1 witness element → keypath (Schnorr signature)
 *   - Last element starts with 0x50 → annex, strip before classification
 *   - After annex removal: 1 element → keypath, 2+ → scriptpath
 */
function classifyTaprootSpend(witness: string[]): InputScriptType {
  if (witness.length <= 1) return "p2tr_keypath";

  let effective = witness;
  if (witness.length >= 2 && witness[witness.length - 1].startsWith("50")) {
    effective = witness.slice(0, -1);
  }

  return effective.length <= 1 ? "p2tr_keypath" : "p2tr_scriptpath";
}

function classifyP2shInput(scriptSigHex: string, witness: string[]): InputScriptType {
  if (witness.length === 0) return "unknown";

  // P2SH-P2WPKH: scriptSig = 16 0014{20-byte-hash} → 46 hex chars
  if (scriptSigHex.length === 46 && scriptSigHex.startsWith("16") && scriptSigHex.slice(2).startsWith("0014")) {
    return "p2sh-p2wpkh";
  }

  // P2SH-P2WSH: scriptSig = 22 0020{32-byte-hash} → 70 hex chars
  if (scriptSigHex.length === 70 && scriptSigHex.startsWith("22") && scriptSigHex.slice(2).startsWith("0020")) {
    return "p2sh-p2wsh";
  }

  return "unknown";
}

export interface OpReturnData {
  op_return_data_hex: string;
  op_return_data_utf8: string | null;
  op_return_protocol: string;
}

export function parseOpReturnPayload(scriptHex: string): OpReturnData {
  const buf = Buffer.from(scriptHex, "hex");

  if (buf.length === 0 || buf[0] !== 0x6a) {
    return { op_return_data_hex: "", op_return_data_utf8: null, op_return_protocol: "unknown" };
  }

  const chunks: Buffer[] = [];
  let i = 1;

  while (i < buf.length) {
    const op = buf[i++];

    if (op >= 0x01 && op <= 0x4b) {
      chunks.push(buf.subarray(i, i + op));
      i += op;
    } else if (op === 0x4c && i < buf.length) {
      const len = buf[i++];
      chunks.push(buf.subarray(i, i + len));
      i += len;
    } else if (op === 0x4d && i + 1 < buf.length) {
      const len = buf.readUInt16LE(i);
      i += 2;
      chunks.push(buf.subarray(i, i + len));
      i += len;
    } else if (op === 0x4e && i + 3 < buf.length) {
      const len = buf.readUInt32LE(i);
      i += 4;
      chunks.push(buf.subarray(i, i + len));
      i += len;
    }
  }

  const combined = Buffer.concat(chunks);
  const dataHex = combined.toString("hex");
  const utf8 = tryDecodeUtf8(combined);
  const protocol = detectProtocol(dataHex);

  return { op_return_data_hex: dataHex, op_return_data_utf8: utf8, op_return_protocol: protocol };
}

function tryDecodeUtf8(buf: Buffer): string | null {
  if (buf.length === 0) return "";
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(buf);
  } catch {
    return null;
  }
}

function detectProtocol(dataHex: string): string {
  if (dataHex.startsWith("6f6d6e69")) return "omni";
  if (dataHex.startsWith("0109f91102")) return "opentimestamps";
  return "unknown";
}
