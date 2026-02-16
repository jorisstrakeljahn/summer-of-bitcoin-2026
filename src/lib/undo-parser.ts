/**
 * Bitcoin Core undo data parser (rev*.dat).
 *
 * Undo data stores prevouts for each non-coinbase transaction in a block.
 * Uses Bitcoin Core's own VARINT encoding (base-128) and compressed script format.
 *
 * IMPORTANT: The undo serialization uses TxInUndoFormatter which includes
 * a dummy version byte after nCode when height > 0 (for backward compat).
 *
 * References: Bitcoin Core undo.h, compressor.cpp, coins.h
 */

import { BufferReader } from "./buffer-reader.js";

export interface UndoPrevout {
  value_sats: number;
  script_pubkey_hex: string;
}

export type BlockUndo = UndoPrevout[][];

/**
 * Parse undo data for one block from a BufferReader.
 *
 * Format: CompactSize(txCount) [CompactSize(inputCount) [Coin...] ...]
 */
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

// ---------------------------------------------------------------------------
// Undo Coin = nCode + [dummy version] + CompressedTxOut
// (TxInUndoFormatter format from undo.h)
// ---------------------------------------------------------------------------

function readUndoCoin(reader: BufferReader): UndoPrevout {
  const nCode = readCoreVarInt(reader);
  const height = nCode >>> 1;

  // Dummy version byte for backward compatibility (present when height > 0)
  if (height > 0) {
    readCoreVarInt(reader);
  }

  const compressedAmount = readCoreVarInt(reader);
  const value_sats = decompressAmount(compressedAmount);
  const script_pubkey_hex = readCompressedScript(reader);

  return { value_sats, script_pubkey_hex };
}

// ---------------------------------------------------------------------------
// Bitcoin Core VARINT (base-128 with +1 offset on continuation)
// ---------------------------------------------------------------------------

function readCoreVarInt(reader: BufferReader): number {
  let n = 0;
  for (;;) {
    const b = reader.readUInt8();
    n = (n << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) return n;
    n++;
  }
}

// ---------------------------------------------------------------------------
// Amount decompression (Bitcoin Core compressor.cpp)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Compressed script (Bitcoin Core compressor.cpp)
//
// nSize 0 → P2PKH (20 bytes hash follow)
// nSize 1 → P2SH  (20 bytes hash follow)
// nSize 2,3 → compressed pubkey P2PK (32 bytes x-coord follow)
// nSize 4,5 → uncompressed pubkey → compressed P2PK (32 bytes follow)
// nSize ≥ 6 → raw script of (nSize - 6) bytes
// ---------------------------------------------------------------------------

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

  // Raw script
  const len = nSize - 6;
  if (len <= 0) return "";
  return reader.readSlice(len).toString("hex");
}
