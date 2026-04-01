/**
 * Bitcoin script classification, disassembly, and OP_RETURN parsing.
 */

import type { OutputScriptType, InputScriptType } from "./types.js";

// ---------------------------------------------------------------------------
// Output Script Classification
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Input Script Classification
// ---------------------------------------------------------------------------

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
 * Classify a Taproot spend — keypath vs scriptpath.
 *
 * BIP341 rules:
 *   - If the witness stack has exactly 1 element → keypath (Schnorr signature).
 *   - If the last element starts with 0x50 → it's an annex; strip it for classification.
 *   - After stripping annex: 1 element → keypath, 2+ elements → scriptpath.
 *   - Scriptpath: last element (after annex removal) is the control block (0xc0/0xc1 prefix).
 */
function classifyTaprootSpend(witness: string[]): InputScriptType {
  if (witness.length === 0) return "p2tr_keypath";
  if (witness.length === 1) return "p2tr_keypath";

  // Check for annex: last witness item starts with 0x50
  let effective = witness;
  if (witness.length >= 2 && witness[witness.length - 1].startsWith("50")) {
    effective = witness.slice(0, -1);
  }

  if (effective.length <= 1) return "p2tr_keypath";
  return "p2tr_scriptpath";
}

/** Classify a P2SH input — could be wrapped SegWit (p2sh-p2wpkh or p2sh-p2wsh). */
function classifyP2shInput(scriptSigHex: string, witness: string[]): InputScriptType {
  if (witness.length === 0) return "unknown";

  // P2SH-P2WPKH: scriptSig pushes a 22-byte redeem script (0014{20-byte-hash})
  // Hex pattern: 16 0014{40hex} → total 46 hex chars
  if (scriptSigHex.length === 46 && scriptSigHex.startsWith("16") && scriptSigHex.slice(2).startsWith("0014")) {
    return "p2sh-p2wpkh";
  }

  // P2SH-P2WSH: scriptSig pushes a 34-byte redeem script (0020{32-byte-hash})
  // Hex pattern: 22 0020{64hex} → total 70 hex chars
  if (scriptSigHex.length === 70 && scriptSigHex.startsWith("22") && scriptSigHex.slice(2).startsWith("0020")) {
    return "p2sh-p2wsh";
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// Script Disassembly
// ---------------------------------------------------------------------------

/** Opcode name lookup using bitcoin-ops (loaded lazily). */
let opcodeNames: Map<number, string> | null = null;

function getOpcodeNames(): Map<number, string> {
  if (opcodeNames) return opcodeNames;

  opcodeNames = new Map<number, string>();

  // Core opcodes
  opcodeNames.set(0x00, "OP_0");
  // OP_PUSHBYTES 0x01-0x4b handled separately
  opcodeNames.set(0x4c, "OP_PUSHDATA1");
  opcodeNames.set(0x4d, "OP_PUSHDATA2");
  opcodeNames.set(0x4e, "OP_PUSHDATA4");
  opcodeNames.set(0x4f, "OP_1NEGATE");
  opcodeNames.set(0x50, "OP_RESERVED");
  for (let i = 1; i <= 16; i++) opcodeNames.set(0x50 + i, `OP_${i}`);

  // Flow control
  opcodeNames.set(0x61, "OP_NOP");
  opcodeNames.set(0x62, "OP_VER");
  opcodeNames.set(0x63, "OP_IF");
  opcodeNames.set(0x64, "OP_NOTIF");
  opcodeNames.set(0x65, "OP_VERIF");
  opcodeNames.set(0x66, "OP_VERNOTIF");
  opcodeNames.set(0x67, "OP_ELSE");
  opcodeNames.set(0x68, "OP_ENDIF");
  opcodeNames.set(0x69, "OP_VERIFY");
  opcodeNames.set(0x6a, "OP_RETURN");

  // Stack
  opcodeNames.set(0x6b, "OP_TOALTSTACK");
  opcodeNames.set(0x6c, "OP_FROMALTSTACK");
  opcodeNames.set(0x6d, "OP_2DROP");
  opcodeNames.set(0x6e, "OP_2DUP");
  opcodeNames.set(0x6f, "OP_3DUP");
  opcodeNames.set(0x70, "OP_2OVER");
  opcodeNames.set(0x71, "OP_2ROT");
  opcodeNames.set(0x72, "OP_2SWAP");
  opcodeNames.set(0x73, "OP_IFDUP");
  opcodeNames.set(0x74, "OP_DEPTH");
  opcodeNames.set(0x75, "OP_DROP");
  opcodeNames.set(0x76, "OP_DUP");
  opcodeNames.set(0x77, "OP_NIP");
  opcodeNames.set(0x78, "OP_OVER");
  opcodeNames.set(0x79, "OP_PICK");
  opcodeNames.set(0x7a, "OP_ROLL");
  opcodeNames.set(0x7b, "OP_ROT");
  opcodeNames.set(0x7c, "OP_SWAP");
  opcodeNames.set(0x7d, "OP_TUCK");

  // Splice
  opcodeNames.set(0x7e, "OP_CAT");
  opcodeNames.set(0x7f, "OP_SUBSTR");
  opcodeNames.set(0x80, "OP_LEFT");
  opcodeNames.set(0x81, "OP_RIGHT");
  opcodeNames.set(0x82, "OP_SIZE");

  // Bitwise
  opcodeNames.set(0x83, "OP_INVERT");
  opcodeNames.set(0x84, "OP_AND");
  opcodeNames.set(0x85, "OP_OR");
  opcodeNames.set(0x86, "OP_XOR");
  opcodeNames.set(0x87, "OP_EQUAL");
  opcodeNames.set(0x88, "OP_EQUALVERIFY");
  opcodeNames.set(0x89, "OP_RESERVED1");
  opcodeNames.set(0x8a, "OP_RESERVED2");

  // Arithmetic
  opcodeNames.set(0x8b, "OP_1ADD");
  opcodeNames.set(0x8c, "OP_1SUB");
  opcodeNames.set(0x8d, "OP_2MUL");
  opcodeNames.set(0x8e, "OP_2DIV");
  opcodeNames.set(0x8f, "OP_NEGATE");
  opcodeNames.set(0x90, "OP_ABS");
  opcodeNames.set(0x91, "OP_NOT");
  opcodeNames.set(0x92, "OP_0NOTEQUAL");
  opcodeNames.set(0x93, "OP_ADD");
  opcodeNames.set(0x94, "OP_SUB");
  opcodeNames.set(0x95, "OP_MUL");
  opcodeNames.set(0x96, "OP_DIV");
  opcodeNames.set(0x97, "OP_MOD");
  opcodeNames.set(0x98, "OP_LSHIFT");
  opcodeNames.set(0x99, "OP_RSHIFT");
  opcodeNames.set(0x9a, "OP_BOOLAND");
  opcodeNames.set(0x9b, "OP_BOOLOR");
  opcodeNames.set(0x9c, "OP_NUMEQUAL");
  opcodeNames.set(0x9d, "OP_NUMEQUALVERIFY");
  opcodeNames.set(0x9e, "OP_NUMNOTEQUAL");
  opcodeNames.set(0x9f, "OP_LESSTHAN");
  opcodeNames.set(0xa0, "OP_GREATERTHAN");
  opcodeNames.set(0xa1, "OP_LESSTHANOREQUAL");
  opcodeNames.set(0xa2, "OP_GREATERTHANOREQUAL");
  opcodeNames.set(0xa3, "OP_MIN");
  opcodeNames.set(0xa4, "OP_MAX");
  opcodeNames.set(0xa5, "OP_WITHIN");

  // Crypto
  opcodeNames.set(0xa6, "OP_RIPEMD160");
  opcodeNames.set(0xa7, "OP_SHA1");
  opcodeNames.set(0xa8, "OP_SHA256");
  opcodeNames.set(0xa9, "OP_HASH160");
  opcodeNames.set(0xaa, "OP_HASH256");
  opcodeNames.set(0xab, "OP_CODESEPARATOR");
  opcodeNames.set(0xac, "OP_CHECKSIG");
  opcodeNames.set(0xad, "OP_CHECKSIGVERIFY");
  opcodeNames.set(0xae, "OP_CHECKMULTISIG");
  opcodeNames.set(0xaf, "OP_CHECKMULTISIGVERIFY");

  // Expansion
  opcodeNames.set(0xb0, "OP_NOP1");
  opcodeNames.set(0xb1, "OP_CHECKLOCKTIMEVERIFY");
  opcodeNames.set(0xb2, "OP_CHECKSEQUENCEVERIFY");
  opcodeNames.set(0xb3, "OP_NOP4");
  opcodeNames.set(0xb4, "OP_NOP5");
  opcodeNames.set(0xb5, "OP_NOP6");
  opcodeNames.set(0xb6, "OP_NOP7");
  opcodeNames.set(0xb7, "OP_NOP8");
  opcodeNames.set(0xb8, "OP_NOP9");
  opcodeNames.set(0xb9, "OP_NOP10");
  opcodeNames.set(0xba, "OP_CHECKSIGADD");

  return opcodeNames;
}

/**
 * Disassemble a hex-encoded script into human-readable ASM.
 * Returns "" for empty scripts.
 */
export function disassembleScript(scriptHex: string): string {
  if (!scriptHex || scriptHex.length === 0) return "";

  const buf = Buffer.from(scriptHex, "hex");
  const names = getOpcodeNames();
  const tokens: string[] = [];
  let i = 0;

  while (i < buf.length) {
    const op = buf[i++];

    // Direct push: 0x01–0x4b
    if (op >= 0x01 && op <= 0x4b) {
      const data = buf.subarray(i, i + op).toString("hex");
      tokens.push(`OP_PUSHBYTES_${op} ${data}`);
      i += op;
      continue;
    }

    // OP_PUSHDATA1
    if (op === 0x4c) {
      if (i >= buf.length) break;
      const len = buf[i++];
      const data = buf.subarray(i, i + len).toString("hex");
      tokens.push(`OP_PUSHDATA1 ${data}`);
      i += len;
      continue;
    }

    // OP_PUSHDATA2
    if (op === 0x4d) {
      if (i + 1 >= buf.length) break;
      const len = buf.readUInt16LE(i);
      i += 2;
      const data = buf.subarray(i, i + len).toString("hex");
      tokens.push(`OP_PUSHDATA2 ${data}`);
      i += len;
      continue;
    }

    // OP_PUSHDATA4
    if (op === 0x4e) {
      if (i + 3 >= buf.length) break;
      const len = buf.readUInt32LE(i);
      i += 4;
      const data = buf.subarray(i, i + len).toString("hex");
      tokens.push(`OP_PUSHDATA4 ${data}`);
      i += len;
      continue;
    }

    // Named opcode or unknown
    const name = names.get(op);
    tokens.push(name ?? `OP_UNKNOWN_0x${op.toString(16).padStart(2, "0")}`);
  }

  return tokens.join(" ");
}

// ---------------------------------------------------------------------------
// OP_RETURN Payload Parsing
// ---------------------------------------------------------------------------

export interface OpReturnData {
  op_return_data_hex: string;
  op_return_data_utf8: string | null;
  op_return_protocol: string;
}

/**
 * Extract payload from an OP_RETURN script.
 * Handles all push opcodes (direct, PUSHDATA1/2/4).
 * Concatenates all data pushes after OP_RETURN.
 */
export function parseOpReturnPayload(scriptHex: string): OpReturnData {
  const buf = Buffer.from(scriptHex, "hex");

  // First byte should be 0x6a (OP_RETURN)
  if (buf.length === 0 || buf[0] !== 0x6a) {
    return { op_return_data_hex: "", op_return_data_utf8: null, op_return_protocol: "unknown" };
  }

  const chunks: Buffer[] = [];
  let i = 1; // skip OP_RETURN

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
    // Other opcodes after OP_RETURN are ignored (non-standard)
  }

  const dataHex = Buffer.concat(chunks).toString("hex");
  const utf8 = tryDecodeUtf8(Buffer.concat(chunks));
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
