/**
 * Bitcoin block file parser.
 *
 * Parses blk*.dat files and matches them with undo data from rev*.dat.
 * Blocks in blk*.dat may be stored out of height order (download order),
 * while undo records in rev*.dat are in validation order (by height).
 * We sort blocks by BIP34 coinbase height before matching with undo records.
 *
 * Block structure:
 *   [magic:4] [size:4] [header:80] [tx_count:varint] [transactions...]
 */

import { BufferReader } from "./buffer-reader.js";
import { sha256d, reverseBuffer } from "./hash.js";
import { computeMerkleRoot } from "./merkle.js";
import { parseTransaction } from "./tx-parser.js";
import { serializeLegacy } from "./tx-serializer.js";
import { parseBlockUndo } from "./undo-parser.js";
import type { BlockUndo } from "./undo-parser.js";
import type { ParsedTransaction } from "./types.js";

const MAINNET_MAGIC = 0xd9b4bef9;

export interface ParsedBlockHeader {
  version: number;
  prevBlockHash: string;
  merkleRoot: string;
  timestamp: number;
  bits: string;
  nonce: number;
  blockHash: string;
}

export interface ParsedBlock {
  header: ParsedBlockHeader;
  transactions: ParsedTransaction[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Iterate over all blocks in a blk/rev file pair, yielding one at a time.
 *
 * Blocks in blk*.dat may arrive out of height order (Bitcoin Core stores
 * them in download order). Undo records in rev*.dat are in validation order
 * (strictly by height). We sort blocks by BIP34 coinbase height to align
 * them with the undo records before yielding.
 */
export function* iterateBlocks(
  blkData: Buffer,
  revData: Buffer,
  xorKey: Buffer,
): Generator<{ block: ParsedBlock; undo: BlockUndo }> {
  const needsXor = xorKey.length > 0 && !xorKey.every(b => b === 0);

  const blk = needsXor ? applyXor(Buffer.from(blkData), xorKey) : blkData;
  const rev = needsXor ? applyXor(Buffer.from(revData), xorKey) : revData;

  // Phase 1: Parse all blocks
  const blocks = readAllBlocks(new BufferReader(blk));

  // Phase 2: Sort by BIP34 coinbase height
  blocks.sort((a, b) => extractBip34Height(a) - extractBip34Height(b));

  // Phase 3: Parse undo records (already in height order) and match
  const revReader = new BufferReader(rev);
  for (const block of blocks) {
    const undo = readOneUndo(revReader);
    yield { block, undo };
  }
}

/** Verify the computed merkle root matches the block header. */
export function verifyMerkleRoot(block: ParsedBlock, precomputedTxids?: Buffer[]): boolean {
  const txidBuffers = precomputedTxids ?? block.transactions.map(tx =>
    sha256d(serializeLegacy(tx)),
  );
  const computed = computeMerkleRoot(txidBuffers);
  const headerRootInternal = reverseBuffer(Buffer.from(block.header.merkleRoot, "hex"));
  return computed.equals(headerRootInternal);
}

/** Decode BIP34 height and coinbase metadata from the first transaction. */
export function parseCoinbase(tx: ParsedTransaction): {
  bip34Height: number;
  coinbaseScriptHex: string;
  totalOutputSats: number;
} {
  const scriptSig = tx.inputs[0].scriptSig;
  const pushLen = scriptSig[0];

  let height = 0;
  for (let i = 0; i < pushLen && i < scriptSig.length - 1; i++) {
    height |= scriptSig[1 + i] << (8 * i);
  }

  return {
    bip34Height: height,
    coinbaseScriptHex: scriptSig.toString("hex"),
    totalOutputSats: tx.outputs.reduce((s, o) => s + Number(o.value), 0),
  };
}

// ---------------------------------------------------------------------------
// Block collection + height extraction
// ---------------------------------------------------------------------------

function readAllBlocks(blkReader: BufferReader): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  while (blkReader.remaining >= 8) {
    const magic = blkReader.readUInt32LE();
    if (magic !== MAINNET_MAGIC) break;
    const blockSize = blkReader.readUInt32LE();
    const blockBytes = blkReader.readSlice(blockSize);
    blocks.push(parseOneBlock(blockBytes));
  }
  return blocks;
}

/** Extract BIP34 height from the coinbase scriptSig. */
function extractBip34Height(block: ParsedBlock): number {
  const scriptSig = block.transactions[0].inputs[0].scriptSig;
  const pushLen = scriptSig[0];
  let height = 0;
  for (let i = 0; i < pushLen && i < scriptSig.length - 1; i++) {
    height |= scriptSig[1 + i] << (8 * i);
  }
  return height;
}

// ---------------------------------------------------------------------------
// XOR deobfuscation
// ---------------------------------------------------------------------------

function applyXor(data: Buffer, key: Buffer): Buffer {
  for (let i = 0; i < data.length; i++) {
    data[i] ^= key[i % key.length];
  }
  return data;
}

// ---------------------------------------------------------------------------
// Single block parsing
// ---------------------------------------------------------------------------

function parseOneBlock(blockBytes: Buffer): ParsedBlock {
  const reader = new BufferReader(blockBytes);
  const header = readBlockHeader(reader, blockBytes.subarray(0, 80));
  const txCount = reader.readCompactSize();
  const transactions = readBlockTransactions(reader, txCount, blockBytes);
  return { header, transactions };
}

function readBlockHeader(reader: BufferReader, headerBytes: Buffer): ParsedBlockHeader {
  const version = reader.readUInt32LE();
  const prevBlockHash = reverseBuffer(reader.readSlice(32)).toString("hex");
  const merkleRoot = reverseBuffer(reader.readSlice(32)).toString("hex");
  const timestamp = reader.readUInt32LE();
  const bitsRaw = reader.readUInt32LE();
  const nonce = reader.readUInt32LE();

  return {
    version,
    prevBlockHash,
    merkleRoot,
    timestamp,
    bits: bitsRaw.toString(16).padStart(8, "0"),
    nonce,
    blockHash: reverseBuffer(sha256d(headerBytes)).toString("hex"),
  };
}

function readBlockTransactions(
  reader: BufferReader,
  count: number,
  blockBytes: Buffer,
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  for (let i = 0; i < count; i++) {
    const start = reader.position;
    skipTransaction(reader);
    transactions.push(parseTransaction(blockBytes.subarray(start, reader.position)));
  }
  return transactions;
}

/** Advance the reader past one transaction without allocating structures. */
function skipTransaction(reader: BufferReader): void {
  reader.skip(4); // version

  let segwit = false;
  if (reader.peekUInt8() === 0x00) {
    reader.skip(2); // marker + flag
    segwit = true;
  }

  const inCount = reader.readCompactSize();
  for (let i = 0; i < inCount; i++) {
    reader.skip(36); // txid + vout
    reader.skip(reader.readCompactSize()); // scriptSig
    reader.skip(4); // sequence
  }

  const outCount = reader.readCompactSize();
  for (let i = 0; i < outCount; i++) {
    reader.skip(8); // value
    reader.skip(reader.readCompactSize()); // scriptPubKey
  }

  if (segwit) {
    for (let i = 0; i < inCount; i++) {
      const stackSize = reader.readCompactSize();
      for (let j = 0; j < stackSize; j++) {
        reader.skip(reader.readCompactSize());
      }
    }
  }

  reader.skip(4); // locktime
}

// ---------------------------------------------------------------------------
// Single undo record reading
// ---------------------------------------------------------------------------

function readOneUndo(reader: BufferReader): BlockUndo {
  const magic = reader.readUInt32LE();
  if (magic !== MAINNET_MAGIC) {
    throw new Error(`Invalid undo magic: 0x${magic.toString(16)}`);
  }

  const undoSize = reader.readUInt32LE();
  const undoBytes = reader.readSlice(undoSize);
  const undo = parseBlockUndo(new BufferReader(undoBytes));

  reader.readSlice(32); // skip checksum
  return undo;
}
