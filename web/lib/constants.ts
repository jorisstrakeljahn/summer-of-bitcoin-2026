/**
 * Color and label mappings for transaction classifications and heuristics.
 * Used for consistent UI styling across charts, tables, and badges.
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
