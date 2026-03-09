/**
 * Bitcoin raw transaction parser.
 *
 * Supports both legacy and SegWit (BIP141) serialization formats.
 *
 * Wire format (legacy):
 *   [version:4] [in_count:varint] [inputs] [out_count:varint] [outputs] [locktime:4]
 *
 * Wire format (SegWit):
 *   [version:4] [marker:0x00] [flag:0x01] [in_count:varint] [inputs]
 *   [out_count:varint] [outputs] [witness] [locktime:4]
 */

import { BufferReader, compactSizeLength } from "./buffer-reader.js";
import type { ParsedTransaction, ParsedInput, ParsedOutput } from "./types.js";

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

function detectSegwit(reader: BufferReader): boolean {
  if (reader.peekUInt8() !== 0x00) return false;

  reader.readUInt8();
  const flag = reader.readUInt8();
  if (flag !== 0x01) {
    throw new Error(`Invalid SegWit flag: expected 0x01, got 0x${flag.toString(16)}`);
  }
  return true;
}

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

interface ByteMetrics {
  nonWitnessBytes: number;
  witnessBytes: number;
}

function computeByteMetrics(
  witness: Buffer[][],
  segwit: boolean,
  totalBytes: number,
): ByteMetrics {
  if (!segwit) {
    return { nonWitnessBytes: totalBytes, witnessBytes: 0 };
  }
  const witnessBytes = computeWitnessBytes(witness);
  return { nonWitnessBytes: totalBytes - witnessBytes, witnessBytes };
}

function computeWitnessBytes(witness: Buffer[][]): number {
  let bytes = 2; // marker + flag
  for (const stack of witness) {
    bytes += compactSizeLength(stack.length);
    for (const item of stack) {
      bytes += compactSizeLength(item.length);
      bytes += item.length;
    }
  }
  return bytes;
}

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

function reverseToHex(buf: Buffer): string {
  const reversed = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    reversed[i] = buf[buf.length - 1 - i];
  }
  return reversed.toString("hex");
}
