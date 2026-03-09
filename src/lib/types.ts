/**
 * Core type definitions for Bitcoin block/transaction parsing.
 * Only contains parsing-level types — analysis types are defined separately.
 */

export type OutputScriptType =
  | "p2pkh"
  | "p2sh"
  | "p2wpkh"
  | "p2wsh"
  | "p2tr"
  | "op_return"
  | "unknown";

export type InputScriptType =
  | "p2pkh"
  | "p2sh-p2wpkh"
  | "p2sh-p2wsh"
  | "p2wpkh"
  | "p2wsh"
  | "p2tr_keypath"
  | "p2tr_scriptpath"
  | "unknown";

export interface ParsedTransaction {
  version: number;
  segwit: boolean;
  inputs: ParsedInput[];
  outputs: ParsedOutput[];
  witness: Buffer[][];
  locktime: number;
  rawHex: string;
  rawBuffer: Buffer;
  nonWitnessBytes: number;
  witnessBytes: number;
}

export interface ParsedInput {
  txid: string;
  vout: number;
  scriptSig: Buffer;
  sequence: number;
}

export interface ParsedOutput {
  value: bigint;
  scriptPubKey: Buffer;
}

export interface ErrorReport {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}
