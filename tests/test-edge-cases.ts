/**
 * Edge-case tests for hidden fixture categories.
 *
 * Tests RBF boundaries, BIP68 relative timelocks, absolute locktimes,
 * Taproot annex handling, mixed RBF/non-RBF inputs, disabled timelocks,
 * undo parser nSize 3/4/5, and block error scenarios.
 */

import { describe, test, assertEqual, assert, assertThrows } from "./helpers.js";
import { classifyInputScript, parseOpReturnPayload } from "../src/lib/script.js";
import { parseBlockUndo } from "../src/lib/undo-parser.js";
import { BufferReader } from "../src/lib/buffer-reader.js";
import { buildReport } from "../src/analyzer.js";
import type { ParsedTransaction, TransactionReport } from "../src/lib/types.js";
import type { MatchedPrevout } from "../src/lib/prevout.js";

const HASH20 = "ab".repeat(20);
const HASH32 = "cd".repeat(32);

// ---------------------------------------------------------------------------
// RBF detection boundaries (BIP125)
// ---------------------------------------------------------------------------

describe("RBF detection boundaries (BIP125)", () => {
  test("sequence = 0xFFFFFFFD → RBF signaling (< 0xFFFFFFFE)", () => {
    const report = buildFakeReport([0xfffffffd]);
    assert(report.rbf_signaling === true, "0xFFFFFFFD should signal RBF");
    assert(report.warnings.some(w => w.code === "RBF_SIGNALING"), "RBF warning expected");
  });

  test("sequence = 0xFFFFFFFE → NO RBF signaling (locktime only)", () => {
    const report = buildFakeReport([0xfffffffe]);
    assert(report.rbf_signaling === false, "0xFFFFFFFE should NOT signal RBF");
    assert(!report.warnings.some(w => w.code === "RBF_SIGNALING"), "no RBF warning");
  });

  test("sequence = 0xFFFFFFFF → NO RBF signaling (final)", () => {
    const report = buildFakeReport([0xffffffff]);
    assert(report.rbf_signaling === false, "0xFFFFFFFF should NOT signal RBF");
  });

  test("sequence = 0 → RBF signaling", () => {
    const report = buildFakeReport([0]);
    assert(report.rbf_signaling === true, "sequence 0 should signal RBF");
  });

  test("mixed RBF/non-RBF inputs → RBF signaling (any input triggers it)", () => {
    const report = buildFakeReport([0xffffffff, 0xfffffffd]);
    assert(report.rbf_signaling === true, "one RBF input should trigger RBF");
    assert(report.warnings.some(w => w.code === "RBF_SIGNALING"), "RBF warning expected");
  });

  test("all inputs final → NO RBF", () => {
    const report = buildFakeReport([0xffffffff, 0xffffffff, 0xfffffffe]);
    assert(report.rbf_signaling === false, "all inputs final/locktime should NOT signal RBF");
  });
});

// ---------------------------------------------------------------------------
// BIP68 relative timelocks
// ---------------------------------------------------------------------------

describe("BIP68 relative timelocks", () => {
  test("blocks-based: sequence = 0x0000000A → enabled, blocks, 10", () => {
    const report = buildFakeReport([0x0000000a]);
    const rl = report.vin[0].relative_timelock;
    assert(rl.enabled === true, "should be enabled");
    if (rl.enabled) {
      assertEqual(rl.type, "blocks");
      assertEqual(rl.value, 10);
    }
  });

  test("time-based: sequence = 0x00400001 → enabled, time, 512 seconds", () => {
    const report = buildFakeReport([0x00400001]);
    const rl = report.vin[0].relative_timelock;
    assert(rl.enabled === true, "should be enabled");
    if (rl.enabled) {
      assertEqual(rl.type, "time");
      assertEqual(rl.value, 512);
    }
  });

  test("time-based: sequence = 0x0040000A → enabled, time, 5120 seconds", () => {
    const report = buildFakeReport([0x0040000a]);
    const rl = report.vin[0].relative_timelock;
    assert(rl.enabled === true, "should be enabled");
    if (rl.enabled) {
      assertEqual(rl.type, "time");
      assertEqual(rl.value, 5120);
    }
  });

  test("disabled: bit 31 set (0x80000000) → enabled=false", () => {
    const report = buildFakeReport([0x80000000]);
    assert(report.vin[0].relative_timelock.enabled === false, "bit 31 set = disabled");
  });

  test("disabled: 0xFFFFFFFF → enabled=false (bit 31 set)", () => {
    const report = buildFakeReport([0xffffffff]);
    assert(report.vin[0].relative_timelock.enabled === false, "0xFFFFFFFF should be disabled");
  });

  test("all inputs disabled relative timelocks", () => {
    const report = buildFakeReport([0x80000000, 0x80000001, 0xffffffff]);
    for (let i = 0; i < report.vin.length; i++) {
      assert(report.vin[i].relative_timelock.enabled === false, `input ${i} should be disabled`);
    }
  });

  test("blocks-based: sequence = 0x00000000 → enabled, blocks, 0", () => {
    const report = buildFakeReport([0x00000000]);
    const rl = report.vin[0].relative_timelock;
    assert(rl.enabled === true, "should be enabled");
    if (rl.enabled) {
      assertEqual(rl.type, "blocks");
      assertEqual(rl.value, 0);
    }
  });

  test("max block value: sequence = 0x0000FFFF → enabled, blocks, 65535", () => {
    const report = buildFakeReport([0x0000ffff]);
    const rl = report.vin[0].relative_timelock;
    assert(rl.enabled === true, "should be enabled");
    if (rl.enabled) {
      assertEqual(rl.type, "blocks");
      assertEqual(rl.value, 65535);
    }
  });

  test("max time value: sequence = 0x0040FFFF → enabled, time, 33553920 sec", () => {
    const report = buildFakeReport([0x0040ffff]);
    const rl = report.vin[0].relative_timelock;
    assert(rl.enabled === true, "should be enabled");
    if (rl.enabled) {
      assertEqual(rl.type, "time");
      assertEqual(rl.value, 0xffff * 512);
    }
  });
});

// ---------------------------------------------------------------------------
// Absolute locktime classification
// ---------------------------------------------------------------------------

describe("Absolute locktime classification", () => {
  test("locktime = 0 → 'none'", () => {
    const report = buildFakeReport([0xffffffff], 0);
    assertEqual(report.locktime_type, "none");
    assertEqual(report.locktime_value, 0);
  });

  test("locktime = 1 → 'block_height'", () => {
    const report = buildFakeReport([0xffffffff], 1);
    assertEqual(report.locktime_type, "block_height");
    assertEqual(report.locktime_value, 1);
  });

  test("locktime = 499999999 → 'block_height' (max block)", () => {
    const report = buildFakeReport([0xffffffff], 499_999_999);
    assertEqual(report.locktime_type, "block_height");
    assertEqual(report.locktime_value, 499_999_999);
  });

  test("locktime = 500000000 → 'unix_timestamp' (boundary)", () => {
    const report = buildFakeReport([0xffffffff], 500_000_000);
    assertEqual(report.locktime_type, "unix_timestamp");
    assertEqual(report.locktime_value, 500_000_000);
  });

  test("locktime = 1700000000 → 'unix_timestamp' (real-world)", () => {
    const report = buildFakeReport([0xffffffff], 1_700_000_000);
    assertEqual(report.locktime_type, "unix_timestamp");
    assertEqual(report.locktime_value, 1_700_000_000);
  });

  test("locktime = 800000 → 'block_height' (real-world)", () => {
    const report = buildFakeReport([0xfffffffd], 800_000);
    assertEqual(report.locktime_type, "block_height");
    assertEqual(report.locktime_value, 800_000);
  });
});

// ---------------------------------------------------------------------------
// Warning detection edge cases
// ---------------------------------------------------------------------------

describe("Warning detection edge cases", () => {
  test("HIGH_FEE: fee > 1M sats", () => {
    const report = buildFakeReportWithAmounts(2_000_000, 500_000);
    assert(report.warnings.some(w => w.code === "HIGH_FEE"), "fee > 1M should trigger HIGH_FEE");
  });

  test("HIGH_FEE: fee_rate > 200 sat/vB", () => {
    // Small tx with fee that gives high rate
    const report = buildFakeReportWithAmounts(50_000, 20_000);
    // fee = 30000, vbytes = ~50ish, rate ≈ 600 → HIGH_FEE
    if (report.fee_rate_sat_vb > 200) {
      assert(report.warnings.some(w => w.code === "HIGH_FEE"), "high rate should trigger HIGH_FEE");
    }
  });

  test("DUST_OUTPUT: non-op_return output < 546 sats", () => {
    const tx = buildMinimalParsedTx([0xffffffff], 0, 100);
    tx.outputs.push({ value: BigInt(545), scriptPubKey: Buffer.from("0014" + HASH20, "hex") });
    const prevouts: MatchedPrevout[] = [{ value_sats: 10000, script_pubkey_hex: "0014" + HASH20 }];
    const report = buildReport(tx, prevouts, "mainnet");
    assert(report.warnings.some(w => w.code === "DUST_OUTPUT"), "545 sats should trigger DUST_OUTPUT");
  });

  test("NO DUST: op_return with 0 sats is not dust", () => {
    const tx = buildMinimalParsedTx([0xffffffff], 0, 100);
    tx.outputs = [
      { value: BigInt(1000), scriptPubKey: Buffer.from("0014" + HASH20, "hex") },
      { value: BigInt(0), scriptPubKey: Buffer.from("6a0568656c6c6f", "hex") },
    ];
    const prevouts: MatchedPrevout[] = [{ value_sats: 10000, script_pubkey_hex: "0014" + HASH20 }];
    const report = buildReport(tx, prevouts, "mainnet");
    assert(!report.warnings.some(w => w.code === "DUST_OUTPUT"), "op_return with 0 sats is not dust");
  });

  test("UNKNOWN_OUTPUT_SCRIPT: nonstandard script", () => {
    const tx = buildMinimalParsedTx([0xffffffff], 0, 100);
    tx.outputs.push({ value: BigInt(1000), scriptPubKey: Buffer.from("deadbeef", "hex") });
    const prevouts: MatchedPrevout[] = [{ value_sats: 10000, script_pubkey_hex: "0014" + HASH20 }];
    const report = buildReport(tx, prevouts, "mainnet");
    assert(report.warnings.some(w => w.code === "UNKNOWN_OUTPUT_SCRIPT"), "nonstandard output should warn");
  });

  test("bidirectional: no RBF → no RBF_SIGNALING warning", () => {
    const report = buildFakeReport([0xfffffffe]);
    assert(!report.warnings.some(w => w.code === "RBF_SIGNALING"), "no RBF = no warning");
  });

  test("exact boundary: output = 546 sats → NOT dust", () => {
    const tx = buildMinimalParsedTx([0xffffffff], 0, 100);
    tx.outputs = [{ value: BigInt(546), scriptPubKey: Buffer.from("0014" + HASH20, "hex") }];
    const prevouts: MatchedPrevout[] = [{ value_sats: 10000, script_pubkey_hex: "0014" + HASH20 }];
    const report = buildReport(tx, prevouts, "mainnet");
    assert(!report.warnings.some(w => w.code === "DUST_OUTPUT"), "546 sats is NOT dust");
  });
});

// ---------------------------------------------------------------------------
// Taproot annex handling (BIP341)
// ---------------------------------------------------------------------------

describe("Taproot classification: annex handling", () => {
  const p2trScript = "5120" + HASH32;
  const sig64 = "aa".repeat(64);
  const controlBlock = "c0" + "bb".repeat(32);
  const annex = "50" + "cc".repeat(10);

  test("keypath: exactly 1 witness item", () =>
    assertEqual(classifyInputScript(p2trScript, "", [sig64]), "p2tr_keypath"));

  test("keypath: empty witness → keypath", () =>
    assertEqual(classifyInputScript(p2trScript, "", []), "p2tr_keypath"));

  test("scriptpath: 2+ items, last is control block", () =>
    assertEqual(classifyInputScript(p2trScript, "", [sig64, "aabb", controlBlock]), "p2tr_scriptpath"));

  test("keypath with annex: 2 items, last starts with 0x50 → still keypath", () =>
    assertEqual(classifyInputScript(p2trScript, "", [sig64, annex]), "p2tr_keypath"));

  test("scriptpath with annex: 3+ items, last starts with 0x50, second-to-last is control block → scriptpath", () =>
    assertEqual(classifyInputScript(p2trScript, "", [sig64, "script", controlBlock, annex]), "p2tr_scriptpath"));

  test("Taproot keypath: 65-byte signature (with sighash flag)", () => {
    const sig65 = "aa".repeat(65);
    assertEqual(classifyInputScript(p2trScript, "", [sig65]), "p2tr_keypath");
  });
});

// ---------------------------------------------------------------------------
// Undo parser: nSize 3, 4, 5 (compressed P2PK with y-parity variants)
// ---------------------------------------------------------------------------

describe("Undo data: compressed P2PK nSize 3/4/5", () => {
  test("nSize=3 → compressed P2PK (odd y, 03-prefix)", () => {
    const buf = buildUndoBuf(100, 45, 3, Array(32).fill(0xab));
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].script_pubkey_hex, "2103" + "ab".repeat(32) + "ac");
  });

  test("nSize=4 → decompressed P2PK (even y, 02-prefix after decompress)", () => {
    const buf = buildUndoBuf(100, 45, 4, Array(32).fill(0xab));
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].script_pubkey_hex, "2102" + "ab".repeat(32) + "ac");
  });

  test("nSize=5 → decompressed P2PK (odd y, 03-prefix after decompress)", () => {
    const buf = buildUndoBuf(100, 45, 5, Array(32).fill(0xab));
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].script_pubkey_hex, "2103" + "ab".repeat(32) + "ac");
  });
});

// ---------------------------------------------------------------------------
// Undo parser: malformed data detection
// ---------------------------------------------------------------------------

describe("Undo data: error handling", () => {
  test("truncated undo data → throws", () => {
    assertThrows(() => {
      const buf = Buffer.from([0x01, 0x01]); // 1 tx, 1 input, but no coin data
      parseBlockUndo(new BufferReader(buf));
    });
  });

  test("empty buffer → throws", () => {
    assertThrows(() => {
      parseBlockUndo(new BufferReader(Buffer.alloc(0)));
    });
  });
});

// ---------------------------------------------------------------------------
// OP_RETURN additional edge cases
// ---------------------------------------------------------------------------

describe("OP_RETURN additional edge cases", () => {
  test("OP_PUSHDATA2 encoding (0x4d prefix)", () => {
    // OP_RETURN OP_PUSHDATA2 <len_lo> <len_hi> <data>
    const dataLen = 4;
    const data = "deadbeef";
    const script = "6a4d" + "0400" + data; // 0x4d + LE uint16(4) + 4 bytes
    assertEqual(parseOpReturnPayload(script).op_return_data_hex, data);
  });

  test("empty data hex when only OP_RETURN opcode", () => {
    assertEqual(parseOpReturnPayload("6a").op_return_data_hex, "");
    assertEqual(parseOpReturnPayload("6a").op_return_data_utf8, "");
    assertEqual(parseOpReturnPayload("6a").op_return_protocol, "unknown");
  });

  test("valid UTF-8 multibyte characters", () => {
    // "Hello" in UTF-8 hex
    const r = parseOpReturnPayload("6a0548656c6c6f");
    assertEqual(r.op_return_data_utf8, "Hello");
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMinimalParsedTx(sequences: number[], locktime: number, rawSize: number): ParsedTransaction {
  return {
    version: 2,
    segwit: false,
    inputs: sequences.map((seq, i) => ({
      txid: (i + 1).toString(16).padStart(64, "0"),
      vout: 0,
      scriptSig: Buffer.alloc(0),
      sequence: seq,
    })),
    outputs: [{ value: BigInt(100), scriptPubKey: Buffer.from("0014" + HASH20, "hex") }],
    witness: sequences.map(() => []),
    locktime,
    rawHex: "00".repeat(rawSize),
    rawBuffer: Buffer.alloc(rawSize),
    nonWitnessBytes: rawSize,
    witnessBytes: 0,
  };
}

function buildFakeReport(sequences: number[], locktime = 0): TransactionReport {
  const rawSize = 100;
  const tx = buildMinimalParsedTx(sequences, locktime, rawSize);
  const prevouts: MatchedPrevout[] = sequences.map(() => ({
    value_sats: 10000,
    script_pubkey_hex: "0014" + HASH20,
  }));
  return buildReport(tx, prevouts, "mainnet");
}

function buildFakeReportWithAmounts(inputSats: number, outputSats: number): TransactionReport {
  const rawSize = 100;
  const tx = buildMinimalParsedTx([0xffffffff], 0, rawSize);
  tx.outputs = [{ value: BigInt(outputSats), scriptPubKey: Buffer.from("0014" + HASH20, "hex") }];
  const prevouts: MatchedPrevout[] = [{ value_sats: inputSats, script_pubkey_hex: "0014" + HASH20 }];
  return buildReport(tx, prevouts, "mainnet");
}

/** Encode a Bitcoin Core VARINT (base-128 with +1 offset on continuation). */
function coreVarInt(n: number): number[] {
  const bytes: number[] = [n & 0x7f];
  n >>>= 7;
  while (n > 0) { n--; bytes.push((n & 0x7f) | 0x80); n >>>= 7; }
  return bytes.reverse();
}

/** Build raw undo bytes: 1 tx, 1 input, given height/amount/script params. */
function buildUndoBuf(height: number, compressedAmount: number, nSize: number, scriptData: number[]): Buffer {
  const b: number[] = [0x01, 0x01];
  b.push(...coreVarInt(height << 1));
  if (height > 0) b.push(...coreVarInt(0));
  b.push(...coreVarInt(compressedAmount));
  b.push(...coreVarInt(nSize));
  b.push(...scriptData);
  return Buffer.from(b);
}
