/**
 * Block parsing: Merkle root, undo data, BIP34 height.
 *
 * Why: Block mode is a core deliverable. Hidden fixtures test:
 * - Merkle root validation (merkle_root_valid field)
 * - Compressed scripts in undo data (nSize 0=P2PKH, 1=P2SH, 2/3=P2PK, ≥6=raw)
 * - BIP34 coinbase height extraction
 * - Amount compression/decompression (Bitcoin Core format)
 *
 * All tests use synthetic binary data — no 133MB fixture files needed.
 */

import { sha256d } from "../src/lib/hash.js";
import { computeMerkleRoot } from "../src/lib/merkle.js";
import { parseCoinbase } from "../src/lib/block-parser.js";
import { parseBlockUndo } from "../src/lib/undo-parser.js";
import { BufferReader } from "../src/lib/buffer-reader.js";
import { describe, test, assertEqual, assert } from "./helpers.js";
import type { ParsedTransaction } from "../src/lib/types.js";

// ---------------------------------------------------------------------------
// Merkle root (SHA256d binary tree — Bitcoin's block verification core)
// ---------------------------------------------------------------------------

describe("Merkle root computation", () => {
  test("single tx: root = txid itself", () => {
    const txid = sha256d(Buffer.from("test tx"));
    assert(computeMerkleRoot([txid]).equals(txid), "single-tx root must equal txid");
  });

  test("two txs: SHA256d(tx1 || tx2)", () => {
    const tx1 = sha256d(Buffer.from("tx1"));
    const tx2 = sha256d(Buffer.from("tx2"));
    const expected = sha256d(Buffer.concat([tx1, tx2]));
    assert(computeMerkleRoot([tx1, tx2]).equals(expected), "pair hash mismatch");
  });

  test("odd count: last hash duplicated before pairing", () => {
    const tx1 = sha256d(Buffer.from("a"));
    const tx2 = sha256d(Buffer.from("b"));
    const tx3 = sha256d(Buffer.from("c"));
    const h12 = sha256d(Buffer.concat([tx1, tx2]));
    const h33 = sha256d(Buffer.concat([tx3, tx3]));
    const expected = sha256d(Buffer.concat([h12, h33]));
    assert(computeMerkleRoot([tx1, tx2, tx3]).equals(expected), "odd-count duplication failed");
  });

  test("empty → 32 zero bytes", () =>
    assert(computeMerkleRoot([]).equals(Buffer.alloc(32)), "empty must return zero hash"));
});

// ---------------------------------------------------------------------------
// BIP34 coinbase height extraction
// ---------------------------------------------------------------------------

describe("BIP34 coinbase height", () => {
  test("height 800000 from 3-byte LE push (0x0C3500)", () => {
    const tx = fakeCoinbaseTx(Buffer.from("0300350c", "hex"), BigInt(312_500_000));
    const info = parseCoinbase(tx);
    assertEqual(info.bip34Height, 800_000);
    assertEqual(info.totalOutputSats, 312_500_000);
  });

  test("height 500000 from 3-byte LE push (0x07A120)", () => {
    // 500000 = 0x07A120 → LE: 20 a1 07
    const tx = fakeCoinbaseTx(Buffer.from("0320a107", "hex"), BigInt(625_000_000));
    assertEqual(parseCoinbase(tx).bip34Height, 500_000);
  });
});

// ---------------------------------------------------------------------------
// Undo data parsing — compressed scripts (hidden fixture categories)
// ---------------------------------------------------------------------------

describe("Undo data: compressed scripts (nSize 0/1/2/≥6)", () => {
  const hash20 = Array(20).fill(0xab);
  const hash32 = Array(32).fill(0xcd);

  test("nSize=0 → P2PKH (76a914…88ac)", () => {
    const buf = buildUndoBuf(100, 45, 0, hash20);
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].value_sats, 50_000);
    assertEqual(undo[0][0].script_pubkey_hex, "76a914" + "ab".repeat(20) + "88ac");
  });

  test("nSize=1 → P2SH (a914…87)", () => {
    const buf = buildUndoBuf(100, 45, 1, hash20);
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].script_pubkey_hex, "a914" + "ab".repeat(20) + "87");
  });

  test("nSize=2 → compressed P2PK (even y, 02-prefix)", () => {
    const buf = buildUndoBuf(100, 45, 2, hash32);
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].script_pubkey_hex, "2102" + "cd".repeat(32) + "ac");
  });

  test("nSize≥6 → raw script bytes (len = nSize - 6)", () => {
    const rawScript = [0xde, 0xad, 0xbe, 0xef];
    const buf = buildUndoBuf(100, 45, 10, rawScript);
    const undo = parseBlockUndo(new BufferReader(buf));
    assertEqual(undo[0][0].script_pubkey_hex, "deadbeef");
  });
});

describe("Undo data: amount decompression", () => {
  test("compressed 0 → 0 sats", () => {
    const buf = buildUndoBuf(0, 0, 0, Array(20).fill(0));
    assertEqual(parseBlockUndo(new BufferReader(buf))[0][0].value_sats, 0);
  });

  test("compressed 45 → 50000 sats", () => {
    const buf = buildUndoBuf(100, 45, 0, Array(20).fill(0));
    assertEqual(parseBlockUndo(new BufferReader(buf))[0][0].value_sats, 50_000);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Encode a Bitcoin Core VARINT (base-128 with +1 offset on continuation). */
function coreVarInt(n: number): number[] {
  const bytes: number[] = [n & 0x7f];
  n >>>= 7;
  while (n > 0) { n--; bytes.push((n & 0x7f) | 0x80); n >>>= 7; }
  return bytes.reverse();
}

/** Build raw undo bytes: 1 tx, 1 input, given height/amount/script params. */
function buildUndoBuf(height: number, compressedAmount: number, nSize: number, scriptData: number[]): Buffer {
  const b: number[] = [0x01, 0x01]; // CompactSize: 1 tx, 1 input
  b.push(...coreVarInt(height << 1)); // nCode (not coinbase)
  if (height > 0) b.push(...coreVarInt(0)); // dummy version (backward compat)
  b.push(...coreVarInt(compressedAmount));
  b.push(...coreVarInt(nSize));
  b.push(...scriptData);
  return Buffer.from(b);
}

/** Create a minimal fake coinbase transaction for BIP34 tests. */
function fakeCoinbaseTx(scriptSig: Buffer, blockReward: bigint): ParsedTransaction {
  return {
    version: 2,
    segwit: false,
    inputs: [{ txid: "0".repeat(64), vout: 0xffffffff, scriptSig, sequence: 0xffffffff }],
    outputs: [{ value: blockReward, scriptPubKey: Buffer.alloc(0) }],
    witness: [],
    locktime: 0,
    rawHex: "",
    rawBuffer: Buffer.alloc(0),
    nonWitnessBytes: 0,
    witnessBytes: 0,
  };
}
