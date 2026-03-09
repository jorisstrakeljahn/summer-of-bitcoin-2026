/**
 * Heuristic registry — central entry point for the analysis engine.
 *
 * Exports all heuristics and provides the analyzeTransaction function
 * that runs all heuristics against a transaction context and returns
 * the combined results with classification.
 */

import type {
  Heuristic,
  HeuristicResult,
  HeuristicId,
  TransactionContext,
  TransactionClassification,
} from "./types.js";
import type { ParsedTransaction, OutputScriptType } from "../lib/types.js";
import type { UndoPrevout } from "../lib/undo-parser.js";
import { classifyOutputScript } from "../lib/script.js";
import { classifyTransaction } from "./classifier.js";

import { cioh } from "./cioh.js";
import { changeDetection } from "./change-detection.js";
import { addressReuse } from "./address-reuse.js";
import { coinjoin } from "./coinjoin.js";
import { consolidation } from "./consolidation.js";
import { selfTransfer } from "./self-transfer.js";
import { roundNumber } from "./round-number.js";
import { opReturn } from "./op-return.js";
import { peelingChain } from "./peeling-chain.js";

const ALL_HEURISTICS: Heuristic[] = [
  cioh,
  changeDetection,
  addressReuse,
  coinjoin,
  consolidation,
  selfTransfer,
  roundNumber,
  opReturn,
  peelingChain,
];

export const HEURISTIC_IDS: HeuristicId[] = ALL_HEURISTICS.map(h => h.id);

export interface TransactionAnalysis {
  txid: string;
  heuristics: Record<string, HeuristicResult>;
  classification: TransactionClassification;
}

export function buildTransactionContext(
  tx: ParsedTransaction,
  txid: string,
  txIndex: number,
  prevouts: UndoPrevout[],
): TransactionContext {
  const isCoinbase = txIndex === 0;

  const inputScriptTypes: OutputScriptType[] = isCoinbase
    ? []
    : prevouts.map(p => classifyOutputScript(p.script_pubkey_hex));

  const outputScriptTypes: OutputScriptType[] = tx.outputs.map(
    o => classifyOutputScript(o.scriptPubKey.toString("hex"))
  );

  const inputValues = isCoinbase ? [] : prevouts.map(p => p.value_sats);
  const outputValues = tx.outputs.map(o => Number(o.value));

  const totalIn = inputValues.reduce((s, v) => s + v, 0);
  const totalOut = outputValues.reduce((s, v) => s + v, 0);
  const fee = isCoinbase ? 0 : totalIn - totalOut;

  const weight = tx.nonWitnessBytes * 4 + tx.witnessBytes;
  const vbytes = Math.ceil(weight / 4);
  const feeRate = vbytes > 0 ? fee / vbytes : 0;

  return {
    tx,
    txid,
    txIndex,
    isCoinbase,
    prevouts,
    inputScriptTypes,
    outputScriptTypes,
    inputValues,
    outputValues,
    fee,
    weight,
    vbytes,
    feeRate,
  };
}

export function analyzeTransaction(ctx: TransactionContext): TransactionAnalysis {
  const heuristics: Record<string, HeuristicResult> = {};

  for (const heuristic of ALL_HEURISTICS) {
    heuristics[heuristic.id] = heuristic.analyze(ctx);
  }

  const classification = classifyTransaction(ctx, heuristics);

  return {
    txid: ctx.txid,
    heuristics,
    classification,
  };
}

export type { TransactionContext, TransactionClassification, HeuristicResult, HeuristicId };
