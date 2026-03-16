/**
 * Color and label mappings for transaction classifications, heuristics,
 * script types, and fee rate buckets. Single source of truth for all
 * display constants used across charts, tables, badges, and API routes.
 */
import type { TransactionClassification, HeuristicId } from "./types";

export const CLASSIFICATION_COLORS: Record<TransactionClassification, string> = {
  simple_payment: "#94a3b8",
  batch_payment: "#3b82f6",
  consolidation: "#06b6d4",
  coinjoin: "#f43f5e",
  self_transfer: "#a855f7",
  unknown: "#6b7280",
};

export const CLASSIFICATION_LABELS: Record<TransactionClassification, string> = {
  simple_payment: "Simple Payment",
  batch_payment: "Batch Payment",
  consolidation: "Consolidation",
  coinjoin: "CoinJoin",
  self_transfer: "Self Transfer",
  unknown: "Unknown",
};

export const HEURISTIC_COLORS: Record<HeuristicId, string> = {
  cioh: "#10b981",
  change_detection: "#14b8a6",
  address_reuse: "#f59e0b",
  coinjoin: "#f43f5e",
  consolidation: "#06b6d4",
  self_transfer: "#a855f7",
  round_number_payment: "#6366f1",
  op_return: "#f97316",
  peeling_chain: "#84cc16",
};

export const HEURISTIC_LABELS: Record<HeuristicId, string> = {
  cioh: "CIOH",
  change_detection: "Change Detection",
  address_reuse: "Address Reuse",
  coinjoin: "CoinJoin",
  consolidation: "Consolidation",
  self_transfer: "Self Transfer",
  round_number_payment: "Round Number",
  op_return: "OP_RETURN",
  peeling_chain: "Peeling Chain",
};

export const HEURISTIC_SHORT_LABELS: Record<HeuristicId, string> = {
  cioh: "CIOH",
  change_detection: "Change Det.",
  address_reuse: "Addr Reuse",
  coinjoin: "CoinJoin",
  consolidation: "Consolid.",
  self_transfer: "Self Xfer",
  round_number_payment: "Round Num.",
  op_return: "OP_RETURN",
  peeling_chain: "Peeling",
};

export const HEURISTIC_DESCRIPTIONS: Record<HeuristicId, string> = {
  cioh: "Multiple inputs likely belong to the same entity (Common Input Ownership).",
  change_detection: "Identified a likely change output based on script type or value analysis.",
  address_reuse: "Same address appears in both inputs and outputs, weakening privacy.",
  coinjoin: "Multiple users combine inputs with equal-value outputs to obscure ownership.",
  consolidation: "Many inputs combined into few outputs — typical wallet maintenance.",
  self_transfer: "All outputs match input script patterns — likely same-entity transfer.",
  round_number_payment: "Output value is a round BTC amount, suggesting it is a payment.",
  op_return: "Contains OP_RETURN output with embedded data (e.g., timestamps, protocols).",
  peeling_chain: "Pattern of large input split into small payment and large change.",
};

export const SCRIPT_TYPE_COLORS: Record<string, string> = {
  p2wpkh: "#3b82f6",
  p2tr: "#8b5cf6",
  p2sh: "#f59e0b",
  p2wsh: "#06b6d4",
  p2pkh: "#10b981",
  op_return: "#f43f5e",
  unknown: "#6b7280",
};

export const SCRIPT_TYPE_LABELS: Record<string, string> = {
  p2wpkh: "P2WPKH",
  p2tr: "P2TR",
  p2sh: "P2SH",
  p2wsh: "P2WSH",
  p2pkh: "P2PKH",
  op_return: "OP_RETURN",
  unknown: "Unknown",
};

export interface FeeBucket {
  min: number;
  max: number;
  label: string;
}

export const FEE_BUCKETS: FeeBucket[] = [
  { min: 0, max: 5, label: "0-5" },
  { min: 5, max: 10, label: "5-10" },
  { min: 10, max: 20, label: "10-20" },
  { min: 20, max: 50, label: "20-50" },
  { min: 50, max: 100, label: "50-100" },
  { min: 100, max: 200, label: "100-200" },
  { min: 200, max: 500, label: "200-500" },
  { min: 500, max: Infinity, label: "500+" },
];

/** Maps a fee rate value to the label of the matching bucket. */
export function getFeeBucketLabel(feeRate: number): string {
  for (const b of FEE_BUCKETS) {
    if (feeRate >= b.min && feeRate < b.max) return b.label;
  }
  return FEE_BUCKETS[FEE_BUCKETS.length - 1].label;
}

// --- Pagination ---

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

// --- UI limits ---

/** Max heuristic badges shown inline before "+N" overflow indicator. */
export const MAX_VISIBLE_HEURISTICS = 4;

/** Duration (ms) the "copied" checkmark stays visible after copying a TXID. */
export const COPY_FEEDBACK_MS = 1500;

/** Dust threshold in satoshis (outputs below this are flagged as dust). */
export const DUST_THRESHOLD_SATS = 546;
