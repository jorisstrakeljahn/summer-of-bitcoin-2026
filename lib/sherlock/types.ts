/**
 * Shared TypeScript types for blockchain analysis: transaction classifications,
 * heuristics, block/chain reports, and API response shapes.
 */
export type TransactionClassification =
  | "simple_payment"
  | "consolidation"
  | "coinjoin"
  | "self_transfer"
  | "batch_payment"
  | "unknown";

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

export interface HeuristicResult {
  detected: boolean;
  [key: string]: unknown;
}

export interface TransactionAnalysis {
  txid: string;
  heuristics: Record<string, HeuristicResult>;
  classification: TransactionClassification;
}

export interface FeeRateStats {
  min_sat_vb: number;
  max_sat_vb: number;
  median_sat_vb: number;
  mean_sat_vb: number;
}

export interface AnalysisSummary {
  total_transactions_analyzed: number;
  heuristics_applied: string[];
  flagged_transactions: number;
  script_type_distribution: Record<string, number>;
  fee_rate_stats: FeeRateStats;
}

export interface BlockAnalysis {
  block_hash: string;
  block_height: number;
  block_timestamp: number;
  tx_count: number;
  analysis_summary: AnalysisSummary;
  transactions: TransactionAnalysis[];
}

export interface ChainAnalysisReport {
  ok: boolean;
  mode: string;
  file: string;
  block_count: number;
  analysis_summary: AnalysisSummary;
  blocks: BlockAnalysis[];
}

export interface FileSummary {
  stem: string;
  block_count: number;
  total_tx: number;
  flagged: number;
}

export interface BlockSummary {
  index: number;
  block_hash: string;
  block_height: number;
  block_timestamp: number;
  tx_count: number;
  flagged: number;
  fee_rate_stats: FeeRateStats;
}

export interface ClassificationDistribution {
  simple_payment: number;
  batch_payment: number;
  consolidation: number;
  coinjoin: number;
  self_transfer: number;
  unknown: number;
}

export interface StatsResponse {
  classification_distribution: ClassificationDistribution;
  heuristic_detections: Record<string, number>;
  fee_rate_histogram: { range: string; count: number }[];
  script_type_distribution: Record<string, number>;
  blocks_timeline: {
    height: number;
    tx_count: number;
    flagged: number;
    avg_fee: number;
    timestamp: number;
  }[];
}

export interface TransactionsPage {
  block_hash: string;
  block_height: number;
  block_timestamp: number;
  total: number;
  page: number;
  size: number;
  total_pages: number;
  transactions: TransactionAnalysis[];
}

export interface MosaicTx {
  txid: string;
  classification: string;
}
