/**
 * Warning detection for Bitcoin transactions.
 */

import type { Warning, VoutEntry } from "./types.js";

export function detectWarnings(
  _feeSats: number,
  _feeRateSatVb: number,
  _rbfSignaling: boolean,
  _vout: VoutEntry[],
): Warning[] {
  // TODO: Implement warning detection
  // HIGH_FEE: fee_sats > 1_000_000 OR fee_rate > 200
  // DUST_OUTPUT: non-op_return output with value < 546
  // UNKNOWN_OUTPUT_SCRIPT: output with script_type == "unknown"
  // RBF_SIGNALING: rbf_signaling == true
  return [];
}
