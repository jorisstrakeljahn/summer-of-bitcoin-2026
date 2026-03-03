/**
 * Transaction safety warnings.
 *
 * Detects conditions that warrant user attention:
 *
 *   HIGH_FEE      — Absolute fee exceeds 1 000 000 sats or effective
 *                   rate exceeds 200 sat/vB. Guards against accidental
 *                   overpayment.
 *
 *   DUST_CHANGE   — Change output below the 546-sat dust threshold.
 *                   Should never occur in practice (the fee calculator
 *                   drops sub-dust change), but included as a safety net.
 *
 *   SEND_ALL      — No change output was created; all leftover value
 *                   was absorbed as fee. Informs the user this is
 *                   effectively a sweep transaction.
 *
 *   RBF_SIGNALING — Transaction signals BIP-125 Replace-By-Fee via
 *                   nSequence. The sender can bump the fee before
 *                   confirmation.
 */

import type { Warning } from "./types";
import { DUST_THRESHOLD_SATS } from "./constants";

export function detectWarnings(params: {
  feeSats: number;
  feeRateSatVb: number;
  changeAmount: number | null;
  rbfSignaling: boolean;
}): Warning[] {
  const warnings: Warning[] = [];

  if (params.feeSats > 1_000_000 || params.feeRateSatVb > 200) {
    warnings.push({ code: "HIGH_FEE" });
  }

  if (params.changeAmount !== null && params.changeAmount < DUST_THRESHOLD_SATS) {
    warnings.push({ code: "DUST_CHANGE" });
  }

  if (params.changeAmount === null) {
    warnings.push({ code: "SEND_ALL" });
  }

  if (params.rbfSignaling) {
    warnings.push({ code: "RBF_SIGNALING" });
  }

  return warnings;
}
