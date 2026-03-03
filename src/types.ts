export type ScriptType =
  | "p2pkh"
  | "p2sh"
  | "p2sh-p2wpkh"
  | "p2wpkh"
  | "p2wsh"
  | "p2tr";

export interface Utxo {
  txid: string;
  vout: number;
  value_sats: number;
  script_pubkey_hex: string;
  script_type: ScriptType;
  address: string;
}

export interface Payment {
  address: string;
  script_pubkey_hex: string;
  script_type: ScriptType;
  value_sats: number;
}

export interface ChangeTemplate {
  address: string;
  script_pubkey_hex: string;
  script_type: ScriptType;
}

export interface Policy {
  max_inputs?: number;
}

export interface Fixture {
  network: string;
  utxos: Utxo[];
  payments: Payment[];
  change: ChangeTemplate;
  fee_rate_sat_vb: number;
  rbf?: boolean;
  locktime?: number;
  current_height?: number;
  policy?: Policy;
}

export interface OutputEntry {
  n: number;
  value_sats: number;
  script_pubkey_hex: string;
  script_type: ScriptType;
  address: string;
  is_change: boolean;
}

export interface Warning {
  code: string;
}

export interface BuildReport {
  ok: true;
  network: string;
  strategy: string;
  selected_inputs: Utxo[];
  outputs: OutputEntry[];
  change_index: number | null;
  fee_sats: number;
  fee_rate_sat_vb: number;
  vbytes: number;
  rbf_signaling: boolean;
  locktime: number;
  locktime_type: "none" | "block_height" | "unix_timestamp";
  psbt_base64: string;
  warnings: Warning[];
}

export interface BuildError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type BuildResult = BuildReport | BuildError;

export interface RbfLocktimeResult {
  nSequence: number;
  nLockTime: number;
  rbfSignaling: boolean;
  locktimeType: "none" | "block_height" | "unix_timestamp";
}

export interface FeeChangeResult {
  fee: number;
  changeAmount: number | null;
  vbytes: number;
}

export interface CoinSelectionResult {
  selectedUtxos: Utxo[];
  fee: number;
  changeAmount: number | null;
  vbytes: number;
  strategyName: string;
}
