import type { Warning } from "./types";

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

  if (params.changeAmount !== null && params.changeAmount < 546) {
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
