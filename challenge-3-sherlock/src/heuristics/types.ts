/**
 * Shared types for chain analysis heuristics.
 *
 * Each heuristic operates on a TransactionContext and produces a
 * HeuristicResult with at minimum a `detected` boolean. Individual
 * heuristics extend the result with additional fields.
 */

import type { ParsedTransaction, OutputScriptType } from "../lib/types.js";
import type { UndoPrevout } from "../lib/undo-parser.js";

export interface TransactionContext {
  tx: ParsedTransaction;
  txid: string;
  txIndex: number;
  isCoinbase: boolean;
  prevouts: UndoPrevout[];
  inputScriptTypes: OutputScriptType[];
  outputScriptTypes: OutputScriptType[];
  inputValues: number[];
  outputValues: number[];
  fee: number;
  weight: number;
  vbytes: number;
  feeRate: number;
}

export interface HeuristicResult {
  detected: boolean;
  [key: string]: unknown;
}

export type HeuristicId =
  | "cioh"
  | "change_detection"
  | "address_reuse"
  | "coinjoin"
  | "consolidation"
  | "self_transfer"
  | "round_number_payment"
  | "op_return"
  | "peeling_chain";

export interface Heuristic {
  id: HeuristicId;
  analyze: (ctx: TransactionContext) => HeuristicResult;
}

export type TransactionClassification =
  | "simple_payment"
  | "consolidation"
  | "coinjoin"
  | "self_transfer"
  | "batch_payment"
  | "unknown";
