/**
 * Bitcoin Core undo data parser (rev*.dat).
 *
 * Undo data stores prevouts for each non-coinbase transaction in a block.
 * Uses Bitcoin Core's own VARINT encoding (base-128) and compressed script format.
 *
 * The undo serialization includes a dummy version byte after nCode when
 * height > 0 (TxInUndoFormatter backward compat).
 *
 * References: Bitcoin Core undo.h, compressor.cpp, coins.h
 */

import { BufferReader } from "./buffer-reader.js";

export interface UndoPrevout {
  value_sats: number;
  script_pubkey_hex: string;
}

export type BlockUndo = UndoPrevout[][];

export function parseBlockUndo(reader: BufferReader): BlockUndo {
  const txCount = reader.readCompactSize();
  const result: UndoPrevout[][] = [];

  for (let t = 0; t < txCount; t++) {
    const inputCount = reader.readCompactSize();
    const prevouts: UndoPrevout[] = [];

    for (let i = 0; i < inputCount; i++) {
      prevouts.push(readUndoCoin(reader));
    }

    result.push(prevouts);
  }

  return result;
}

function readUndoCoin(reader: BufferReader): UndoPrevout {
  const nCode = readCoreVarInt(reader);
  const height = Math.floor(nCode / 2);

  if (height > 0) {
    readCoreVarInt(reader);
  }

  const compressedAmount = readCoreVarInt(reader);
  const value_sats = decompressAmount(compressedAmount);
  const script_pubkey_hex = readCompressedScript(reader);

  return { value_sats, script_pubkey_hex };
}

/**
 * Bitcoin Core VARINT — base-128 with +1 offset on continuation bytes.
 * Different from Bitcoin's CompactSize encoding.
 */
function readCoreVarInt(reader: BufferReader): number {
  let n = 0;
  for (;;) {
    const b = reader.readUInt8();
    // Use arithmetic instead of bitwise shift to avoid 32-bit overflow
    n = n * 128 + (b & 0x7f);
    if ((b & 0x80) === 0) return n;
    n++;
  }
}

/**
 * Amount decompression (Bitcoin Core compressor.cpp DecompressAmount).
 *
 * Encodes trailing zeros (exponent e) and significant digits separately:
 *   1. 0 → amount = 0
 *   2. e = (x-1) % 10 → trailing zeros to restore
 *   3. If e < 9: d = ((x-1)/10 % 9) + 1, mantissa from remainder
 *   4. If e == 9: mantissa = (x-1)/10 + 1
 *   5. Multiply mantissa by 10^e
 */
function decompressAmount(x: number): number {
  if (x === 0) return 0;
  x--;

  const e = x % 10;
  x = Math.floor(x / 10);

  let n: number;
  if (e < 9) {
    const d = (x % 9) + 1;
    x = Math.floor(x / 9);
    n = x * 10 + d;
  } else {
    n = x + 1;
  }

  for (let i = 0; i < e; i++) n *= 10;
  return n;
}

/**
 * Compressed script format (Bitcoin Core compressor.cpp):
 *   nSize 0   → P2PKH (20 bytes hash)
 *   nSize 1   → P2SH  (20 bytes hash)
 *   nSize 2,3 → compressed pubkey P2PK (32 bytes x-coord)
 *   nSize 4,5 → uncompressed pubkey → compressed P2PK (32 bytes)
 *   nSize ≥ 6 → raw script of (nSize - 6) bytes
 */
function readCompressedScript(reader: BufferReader): string {
  const nSize = readCoreVarInt(reader);

  if (nSize === 0) {
    const hash = reader.readSlice(20).toString("hex");
    return `76a914${hash}88ac`;
  }
  if (nSize === 1) {
    const hash = reader.readSlice(20).toString("hex");
    return `a914${hash}87`;
  }
  if (nSize === 2 || nSize === 3) {
    const x = reader.readSlice(32).toString("hex");
    return `21${nSize === 2 ? "02" : "03"}${x}ac`;
  }
  if (nSize === 4 || nSize === 5) {
    const x = reader.readSlice(32).toString("hex");
    return `21${nSize === 4 ? "02" : "03"}${x}ac`;
  }

  const len = nSize - 6;
  if (len <= 0) return "";
  return reader.readSlice(len).toString("hex");
}
