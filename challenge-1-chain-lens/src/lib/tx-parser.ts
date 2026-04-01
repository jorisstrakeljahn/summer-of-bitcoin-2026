/**
 * Bitcoin raw transaction parser.
 *
 * Parses hex-encoded raw transactions into structured data.
 * Supports both legacy and SegWit (BIP141) serialization formats.
 *
 * Wire format (legacy):
 *   [version:4] [in_count:varint] [inputs] [out_count:varint] [outputs] [locktime:4]
 *
 * Wire format (SegWit):
 *   [version:4] [marker:0x00] [flag:0x01] [in_count:varint] [inputs] [out_count:varint] [outputs] [witness] [locktime:4]
 */

import { BufferReader, compactSizeLength } from "./buffer-reader.js";
import type { ParsedTransaction, ParsedInput, ParsedOutput } from "./types.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseTransaction(hexOrBuffer: string | Buffer): ParsedTransaction {
  const raw = toBuffer(hexOrBuffer);
  const reader = new BufferReader(raw);

  const version = reader.readUInt32LE();
  const segwit = detectSegwit(reader);
  const inputs = readInputs(reader);
  const outputs = readOutputs(reader);
  const witness = segwit ? readAllWitness(reader, inputs.length) : emptyWitness(inputs.length);
  const locktime = reader.readUInt32LE();

  const metrics = computeByteMetrics(witness, segwit, raw.length);

  return {
    version,
    segwit,
    inputs,
    outputs,
    witness,
    locktime,
    rawHex: raw.toString("hex"),
    rawBuffer: raw,
    ...metrics,
  };
}

// ---------------------------------------------------------------------------
// SegWit detection
// ---------------------------------------------------------------------------

/**
 * Detect SegWit by checking for the marker byte (0x00) after the version field.
 *
 * In legacy transactions, this position holds the input count varint,
 * which is never 0x00 (a transaction must have at least one input).
 * SegWit uses marker=0x00 flag=0x01 as a signal.
 */
function detectSegwit(reader: BufferReader): boolean {
  if (reader.peekUInt8() !== 0x00) {
    return false;
  }

  // Consume marker and flag bytes
  reader.readUInt8(); // marker = 0x00
  const flag = reader.readUInt8();
  if (flag !== 0x01) {
    throw new Error(`Invalid SegWit flag: expected 0x01, got 0x${flag.toString(16)}`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

function readInputs(reader: BufferReader): ParsedInput[] {
  const count = reader.readCompactSize();
  const inputs: ParsedInput[] = [];

  for (let i = 0; i < count; i++) {
    inputs.push(readSingleInput(reader));
  }
  return inputs;
}

function readSingleInput(reader: BufferReader): ParsedInput {
  const txidBytes = reader.readSlice(32);
  const txid = reverseToHex(txidBytes);
  const vout = reader.readUInt32LE();
  const scriptSigLen = reader.readCompactSize();
  const scriptSig = reader.readSlice(scriptSigLen);
  const sequence = reader.readUInt32LE();

  return { txid, vout, scriptSig, sequence };
}

// ---------------------------------------------------------------------------
// Output parsing
// ---------------------------------------------------------------------------

function readOutputs(reader: BufferReader): ParsedOutput[] {
  const count = reader.readCompactSize();
  const outputs: ParsedOutput[] = [];

  for (let i = 0; i < count; i++) {
    outputs.push(readSingleOutput(reader));
  }
  return outputs;
}

function readSingleOutput(reader: BufferReader): ParsedOutput {
  const value = reader.readUInt64LE();
  const scriptPubKeyLen = reader.readCompactSize();
  const scriptPubKey = reader.readSlice(scriptPubKeyLen);

  return { value, scriptPubKey };
}

// ---------------------------------------------------------------------------
// Witness parsing
// ---------------------------------------------------------------------------

function readAllWitness(reader: BufferReader, inputCount: number): Buffer[][] {
  const witness: Buffer[][] = [];

  for (let i = 0; i < inputCount; i++) {
    witness.push(readWitnessStack(reader));
  }
  return witness;
}

function readWitnessStack(reader: BufferReader): Buffer[] {
  const itemCount = reader.readCompactSize();
  const items: Buffer[] = [];

  for (let j = 0; j < itemCount; j++) {
    const itemLen = reader.readCompactSize();
    items.push(reader.readSlice(itemLen));
  }
  return items;
}

function emptyWitness(inputCount: number): Buffer[][] {
  return Array.from({ length: inputCount }, () => []);
}

// ---------------------------------------------------------------------------
// Byte metrics (for weight/vbytes calculation)
// ---------------------------------------------------------------------------

interface ByteMetrics {
  nonWitnessBytes: number;
  witnessBytes: number;
}

/**
 * Compute non-witness and witness byte counts.
 *
 * Non-witness bytes (counted at weight 4):
 *   version(4) + varint(in_count) + inputs + varint(out_count) + outputs + locktime(4)
 *
 * Witness bytes (counted at weight 1, SegWit only):
 *   marker(1) + flag(1) + all witness stack data (including item count/length varints)
 */
function computeByteMetrics(
  witness: Buffer[][],
  segwit: boolean,
  totalBytes: number,
): ByteMetrics {
  if (!segwit) {
    return { nonWitnessBytes: totalBytes, witnessBytes: 0 };
  }

  const witnessBytes = computeWitnessBytes(witness);
  const nonWitnessBytes = totalBytes - witnessBytes;

  return { nonWitnessBytes, witnessBytes };
}

/**
 * Compute the serialized size of the witness section.
 * Includes the 2-byte marker+flag prefix.
 */
function computeWitnessBytes(witness: Buffer[][]): number {
  // marker(1) + flag(1)
  let bytes = 2;

  for (const stack of witness) {
    bytes += compactSizeLength(stack.length); // item count
    for (const item of stack) {
      bytes += compactSizeLength(item.length); // item length
      bytes += item.length;                    // item data
    }
  }

  return bytes;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBuffer(hexOrBuffer: string | Buffer): Buffer {
  if (Buffer.isBuffer(hexOrBuffer)) return hexOrBuffer;

  if (hexOrBuffer.length % 2 !== 0) {
    throw new Error("Invalid hex string: odd number of characters");
  }
  if (!/^[0-9a-fA-F]*$/.test(hexOrBuffer)) {
    throw new Error("Invalid hex string: contains non-hex characters");
  }

  return Buffer.from(hexOrBuffer, "hex");
}

/** Reverse bytes and convert to hex. Used for txid display convention. */
function reverseToHex(buf: Buffer): string {
  const reversed = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    reversed[i] = buf[buf.length - 1 - i];
  }
  return reversed.toString("hex");
}
