/**
 * Script classification, disassembly, and OP_RETURN parsing.
 *
 * Why: Hidden fixtures test EVERY output/input script type and OP_RETURN
 * edge cases (PUSHDATA1, multiple pushes, Omni prefix, non-UTF8 binary).
 * These are pure-function tests — no fixtures or I/O needed.
 */

import {
  classifyOutputScript,
  classifyInputScript,
  disassembleScript,
  parseOpReturnPayload,
} from "../src/lib/script.js";
import { describe, test, assertEqual } from "./helpers.js";

const HASH20 = "ab".repeat(20);
const HASH32 = "ab".repeat(32);

// ---------------------------------------------------------------------------
// Output script classification (README: 7 types)
// ---------------------------------------------------------------------------

describe("Output script classification (7 types)", () => {
  test("P2PKH (25 bytes: OP_DUP HASH160 <20> EQUALVERIFY CHECKSIG)", () =>
    assertEqual(classifyOutputScript("76a914" + HASH20 + "88ac"), "p2pkh"));

  test("P2SH (23 bytes: OP_HASH160 <20> OP_EQUAL)", () =>
    assertEqual(classifyOutputScript("a914" + HASH20 + "87"), "p2sh"));

  test("P2WPKH (22 bytes: OP_0 <20-byte witness program>)", () =>
    assertEqual(classifyOutputScript("0014" + HASH20), "p2wpkh"));

  test("P2WSH (34 bytes: OP_0 <32-byte witness program>)", () =>
    assertEqual(classifyOutputScript("0020" + HASH32), "p2wsh"));

  test("P2TR (34 bytes: OP_1 <32-byte tweaked pubkey>)", () =>
    assertEqual(classifyOutputScript("5120" + HASH32), "p2tr"));

  test("OP_RETURN (starts with 0x6a)", () =>
    assertEqual(classifyOutputScript("6a0568656c6c6f"), "op_return"));

  test("unknown (non-standard script)", () =>
    assertEqual(classifyOutputScript("deadbeef"), "unknown"));
});

// ---------------------------------------------------------------------------
// Input script classification (README: 8 types)
// ---------------------------------------------------------------------------

describe("Input script classification (8 types)", () => {
  const sig = "3044" + "aa".repeat(34);
  const pubkey = "02" + "cc".repeat(32);

  test("P2PKH spend", () =>
    assertEqual(classifyInputScript("76a914" + HASH20 + "88ac", sig, []), "p2pkh"));

  test("P2WPKH spend (native SegWit)", () =>
    assertEqual(classifyInputScript("0014" + HASH20, "", [sig, pubkey]), "p2wpkh"));

  test("P2WSH spend", () =>
    assertEqual(classifyInputScript("0020" + HASH32, "", ["00", sig, "aabb"]), "p2wsh"));

  test("P2TR keypath (exactly 1 witness item)", () =>
    assertEqual(classifyInputScript("5120" + HASH32, "", [sig]), "p2tr_keypath"));

  test("P2TR scriptpath (2+ witness items with control block)", () =>
    assertEqual(classifyInputScript("5120" + HASH32, "", [sig, "script", "c0" + "bb".repeat(32)]), "p2tr_scriptpath"));

  test("P2SH-P2WPKH (nested SegWit, 22-byte redeem script)", () =>
    assertEqual(classifyInputScript("a914" + HASH20 + "87", "16" + "0014" + HASH20, [sig, pubkey]), "p2sh-p2wpkh"));

  test("P2SH-P2WSH (nested SegWit, 34-byte redeem script)", () =>
    assertEqual(classifyInputScript("a914" + HASH20 + "87", "22" + "0020" + HASH32, ["00", sig, "ws"]), "p2sh-p2wsh"));

  test("unknown (P2SH without witness)", () =>
    assertEqual(classifyInputScript("a914" + HASH20 + "87", "04deadbeef", []), "unknown"));
});

// ---------------------------------------------------------------------------
// OP_RETURN parsing (hidden fixture categories: PUSHDATA1, multi-push, Omni)
// ---------------------------------------------------------------------------

describe("OP_RETURN payload parsing (hidden fixture edge cases)", () => {
  test("simple UTF-8: 'sob-2026'", () => {
    const r = parseOpReturnPayload("6a08736f622d32303236");
    assertEqual(r.op_return_data_utf8, "sob-2026");
    assertEqual(r.op_return_protocol, "unknown");
  });

  test("Omni protocol detection (prefix 6f6d6e69)", () =>
    assertEqual(parseOpReturnPayload("6a146f6d6e69" + "00".repeat(16)).op_return_protocol, "omni"));

  test("OpenTimestamps detection (prefix 0109f91102)", () =>
    assertEqual(parseOpReturnPayload("6a050109f91102").op_return_protocol, "opentimestamps"));

  test("bare OP_RETURN (no data pushes) → empty hex", () =>
    assertEqual(parseOpReturnPayload("6a").op_return_data_hex, ""));

  test("PUSHDATA1 encoding (0x4c prefix)", () => {
    const data = "aa".repeat(80);
    assertEqual(parseOpReturnPayload("6a4c50" + data).op_return_data_hex, data);
  });

  test("multiple pushes → concatenated in order", () =>
    assertEqual(parseOpReturnPayload("6a0401020304020506").op_return_data_hex, "010203040506"));

  test("non-UTF8 binary → utf8 = null", () =>
    assertEqual(parseOpReturnPayload("6a04ff00fe80").op_return_data_utf8, null));
});

// ---------------------------------------------------------------------------
// Script disassembly (must support all opcodes, OP_PUSHBYTES, OP_PUSHDATA)
// ---------------------------------------------------------------------------

describe("Script disassembly", () => {
  test("empty → empty string", () =>
    assertEqual(disassembleScript(""), ""));

  test("P2PKH template", () => {
    const h = "89abcdef0123456789abcdef0123456789abcdef";
    assertEqual(
      disassembleScript("76a914" + h + "88ac"),
      `OP_DUP OP_HASH160 OP_PUSHBYTES_20 ${h} OP_EQUALVERIFY OP_CHECKSIG`,
    );
  });

  test("SegWit v0 witness program (OP_0 + push)", () =>
    assertEqual(disassembleScript("0014" + HASH20), `OP_0 OP_PUSHBYTES_20 ${HASH20}`));

  test("Taproot (OP_1 + 32-byte push)", () =>
    assertEqual(disassembleScript("5120" + HASH32), `OP_1 OP_PUSHBYTES_32 ${HASH32}`));

  test("OP_RETURN with data", () =>
    assertEqual(disassembleScript("6a08736f622d32303236"), "OP_RETURN OP_PUSHBYTES_8 736f622d32303236"));
});
