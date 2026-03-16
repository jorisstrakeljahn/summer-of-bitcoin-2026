/**
 * Test helper for building TransactionContext objects.
 *
 * Provides a mockCtx() builder that accepts partial overrides
 * and fills in sensible defaults for a standard 1-in / 2-out P2WPKH
 * transaction. This keeps individual test files focused on the
 * heuristic logic rather than boilerplate setup.
 */

import type { TransactionContext } from "../../src/heuristics/types.js";
import type { ParsedTransaction, OutputScriptType } from "../../src/lib/types.js";
import type { UndoPrevout } from "../../src/lib/undo-parser.js";

const EMPTY_BUF = Buffer.alloc(0);

function defaultTx(inputCount: number, outputCount: number): ParsedTransaction {
  return {
    version: 2,
    segwit: true,
    inputs: Array.from({ length: inputCount }, () => ({
      txid: "00".repeat(32),
      vout: 0,
      scriptSig: EMPTY_BUF,
      sequence: 0xffffffff,
    })),
    outputs: Array.from({ length: outputCount }, (_, i) => ({
      value: BigInt(i === 0 ? 50_000 : 30_000),
      scriptPubKey: Buffer.from("0014" + "ab".repeat(20), "hex"),
    })),
    witness: [],
    locktime: 0,
    rawHex: "",
    rawBuffer: EMPTY_BUF,
    nonWitnessBytes: 120,
    witnessBytes: 80,
  };
}

export interface MockCtxOptions {
  inputCount?: number;
  outputCount?: number;
  isCoinbase?: boolean;
  inputScriptTypes?: OutputScriptType[];
  outputScriptTypes?: OutputScriptType[];
  inputValues?: number[];
  outputValues?: number[];
  fee?: number;
  tx?: Partial<ParsedTransaction>;
  prevouts?: UndoPrevout[];
}

export function mockCtx(opts: MockCtxOptions = {}): TransactionContext {
  const inputCount = opts.inputCount ?? opts.inputValues?.length ?? opts.inputScriptTypes?.length ?? 1;
  const outputCount = opts.outputCount ?? opts.outputValues?.length ?? opts.outputScriptTypes?.length ?? 2;
  const isCoinbase = opts.isCoinbase ?? false;

  const inputScriptTypes: OutputScriptType[] =
    opts.inputScriptTypes ?? Array(inputCount).fill("p2wpkh");
  const outputScriptTypes: OutputScriptType[] =
    opts.outputScriptTypes ?? Array(outputCount).fill("p2wpkh");
  const inputValues = opts.inputValues ?? (isCoinbase ? [] : Array(inputCount).fill(100_000));
  const outputValues = opts.outputValues ?? Array(outputCount).fill(45_000);

  const totalIn = inputValues.reduce((s, v) => s + v, 0);
  const totalOut = outputValues.reduce((s, v) => s + v, 0);
  const fee = opts.fee ?? (isCoinbase ? 0 : totalIn - totalOut);

  const baseTx = defaultTx(inputCount, outputCount);
  if (opts.tx) {
    Object.assign(baseTx, opts.tx);
  }
  if (opts.tx?.inputs) baseTx.inputs = opts.tx.inputs;
  if (opts.tx?.outputs) baseTx.outputs = opts.tx.outputs;

  const weight = baseTx.nonWitnessBytes * 4 + baseTx.witnessBytes;
  const vbytes = Math.ceil(weight / 4);

  return {
    tx: baseTx,
    txid: "aa".repeat(32),
    txIndex: isCoinbase ? 0 : 1,
    isCoinbase,
    prevouts: opts.prevouts ?? [],
    inputScriptTypes,
    outputScriptTypes,
    inputValues,
    outputValues,
    fee,
    weight,
    vbytes,
    feeRate: vbytes > 0 ? fee / vbytes : 0,
  };
}
