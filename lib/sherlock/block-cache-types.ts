/**
 * TypeScript interfaces for transaction detail API responses (vin, vout,
 * fee, script types). Shared by block-cache and API routes.
 */
export interface TxDetailVin {
  txid: string;
  vout: number;
  sequence: number;
  script_sig_hex: string;
  script_type: string;
  address: string | null;
  value_sats: number;
  has_timelock: boolean;
}

export interface TxDetailVout {
  n: number;
  value_sats: number;
  script_pubkey_hex: string;
  script_type: string;
  address: string | null;
  is_dust: boolean;
  is_op_return: boolean;
}

export interface TxDetailResponse {
  txid: string;
  version: number;
  segwit: boolean;
  locktime: number;
  size_bytes: number;
  weight: number;
  vbytes: number;
  fee_sats: number;
  fee_rate_sat_vb: number;
  total_input_sats: number;
  total_output_sats: number;
  vin: TxDetailVin[];
  vout: TxDetailVout[];
}
