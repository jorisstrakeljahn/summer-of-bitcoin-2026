/**
 * TypeScript type definitions for the Bitcoin transaction/block analyzer.
 */

// ---------------------------------------------------------------------------
// Fixture Input Types
// ---------------------------------------------------------------------------

export interface Fixture {
  network: string;
  raw_tx: string;
  prevouts: FixturePrevout[];
}

export interface FixturePrevout {
  txid: string;
  vout: number;
  value_sats: number;
  script_pubkey_hex: string;
}

// ---------------------------------------------------------------------------
// Output Script Types
// ---------------------------------------------------------------------------

export type OutputScriptType =
  | "p2pkh"
  | "p2sh"
  | "p2wpkh"
  | "p2wsh"
  | "p2tr"
  | "op_return"
  | "unknown";

// ---------------------------------------------------------------------------
// Input Script Types
// ---------------------------------------------------------------------------

export type InputScriptType =
  | "p2pkh"
  | "p2sh-p2wpkh"
  | "p2sh-p2wsh"
  | "p2wpkh"
  | "p2wsh"
  | "p2tr_keypath"
  | "p2tr_scriptpath"
  | "unknown";

// ---------------------------------------------------------------------------
// Locktime
// ---------------------------------------------------------------------------

export type LocktimeType = "none" | "block_height" | "unix_timestamp";

// ---------------------------------------------------------------------------
// Relative Timelock (BIP68)
// ---------------------------------------------------------------------------

export type RelativeTimelock =
  | { enabled: false }
  | { enabled: true; type: "blocks"; value: number }
  | { enabled: true; type: "time"; value: number };

// ---------------------------------------------------------------------------
// Warning Codes
// ---------------------------------------------------------------------------

export type WarningCode =
  | "HIGH_FEE"
  | "DUST_OUTPUT"
  | "UNKNOWN_OUTPUT_SCRIPT"
  | "RBF_SIGNALING";

export interface Warning {
  code: WarningCode;
}

// ---------------------------------------------------------------------------
// Transaction Report (CLI output)
// ---------------------------------------------------------------------------

export interface TransactionReport {
  ok: true;
  network: string;
  segwit: boolean;
  txid: string;
  wtxid: string | null;
  version: number;
  locktime: number;
  size_bytes: number;
  weight: number;
  vbytes: number;
  total_input_sats: number;
  total_output_sats: number;
  fee_sats: number;
  fee_rate_sat_vb: number;
  rbf_signaling: boolean;
  locktime_type: LocktimeType;
  locktime_value: number;
  segwit_savings: SegwitSavings | null;
  vin: VinEntry[];
  vout: VoutEntry[];
  warnings: Warning[];
}

export interface SegwitSavings {
  witness_bytes: number;
  non_witness_bytes: number;
  total_bytes: number;
  weight_actual: number;
  weight_if_legacy: number;
  savings_pct: number;
}

export interface VinEntry {
  txid: string;
  vout: number;
  sequence: number;
  script_sig_hex: string;
  script_asm: string;
  witness: string[];
  script_type: InputScriptType;
  address: string | null;
  prevout: {
    value_sats: number;
    script_pubkey_hex: string;
  };
  relative_timelock: RelativeTimelock;
  witness_script_asm?: string;
}

export interface VoutEntry {
  n: number;
  value_sats: number;
  script_pubkey_hex: string;
  script_asm: string;
  script_type: OutputScriptType;
  address: string | null;
  op_return_data_hex?: string;
  op_return_data_utf8?: string | null;
  op_return_protocol?: string;
}

// ---------------------------------------------------------------------------
// Error Report
// ---------------------------------------------------------------------------

export interface ErrorReport {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type CliOutput = TransactionReport | ErrorReport;

// ---------------------------------------------------------------------------
// Block Report
// ---------------------------------------------------------------------------

export interface BlockReport {
  ok: true;
  mode: "block";
  block_header: {
    version: number;
    prev_block_hash: string;
    merkle_root: string;
    merkle_root_valid: boolean;
    timestamp: number;
    bits: string;
    nonce: number;
    block_hash: string;
  };
  tx_count: number;
  coinbase: {
    bip34_height: number;
    coinbase_script_hex: string;
    total_output_sats: number;
  };
  transactions: TransactionReport[];
  block_stats: {
    total_fees_sats: number;
    total_weight: number;
    avg_fee_rate_sat_vb: number;
    script_type_summary: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Parsed Transaction (internal, before report generation)
// ---------------------------------------------------------------------------

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
