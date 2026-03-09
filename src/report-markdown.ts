/**
 * Markdown report generator for chain analysis output.
 *
 * Produces a human-readable Markdown report from a ChainAnalysisReport.
 * All data is derived deterministically from the report — no runtime-
 * dependent values — ensuring reproducible output across runs.
 */

import type { ChainAnalysisReport, BlockAnalysis } from "./report-json.js";
import type { TransactionAnalysis } from "./heuristics/index.js";
import type { FeeRateStats, ScriptTypeDistribution } from "./stats.js";

const NOTABLE_TX_LIMIT = 10;

const HEURISTIC_LABELS: Record<string, string> = {
  cioh: "Common Input Ownership (CIOH)",
  change_detection: "Change Detection",
  address_reuse: "Address Reuse",
  coinjoin: "CoinJoin",
  consolidation: "Consolidation",
  self_transfer: "Self-Transfer",
  round_number_payment: "Round Number Payment",
  op_return: "OP_RETURN",
  peeling_chain: "Peeling Chain",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  simple_payment: "Simple Payment",
  batch_payment: "Batch Payment",
  consolidation: "Consolidation",
  coinjoin: "CoinJoin",
  self_transfer: "Self-Transfer",
  unknown: "Unknown / Coinbase",
};

export function generateMarkdownReport(report: ChainAnalysisReport): string {
  const lines: string[] = [];

  lines.push(`# Chain Analysis Report: ${report.file}`);
  lines.push("");

  appendFileOverview(lines, report);
  appendSummaryStatistics(lines, report);
  appendBlockSections(lines, report);

  return lines.join("\n");
}

function appendFileOverview(lines: string[], report: ChainAnalysisReport): void {
  const s = report.analysis_summary;
  const flaggedPct = formatPercent(s.flagged_transactions, s.total_transactions_analyzed);

  lines.push("## File Overview");
  lines.push("");
  lines.push(markdownTable(
    ["Property", "Value"],
    [
      ["Source File", `\`${report.file}\``],
      ["Blocks Analyzed", formatInt(report.block_count)],
      ["Total Transactions", formatInt(s.total_transactions_analyzed)],
      ["Flagged Transactions", `${formatInt(s.flagged_transactions)} (${flaggedPct})`],
    ],
  ));
  lines.push("");
}

function appendSummaryStatistics(lines: string[], report: ChainAnalysisReport): void {
  const s = report.analysis_summary;

  lines.push("## Summary Statistics");
  lines.push("");

  lines.push("### Fee Rate Distribution");
  lines.push("");
  lines.push(feeRateTable(s.fee_rate_stats));
  lines.push("");

  lines.push("### Script Type Distribution");
  lines.push("");
  lines.push(scriptTypeTable(s.script_type_distribution));
  lines.push("");

  const allTxs = report.blocks.flatMap(b => b.transactions);
  const heuristicCounts = computeHeuristicCounts(allTxs);
  const totalTx = s.total_transactions_analyzed;

  lines.push("### Heuristic Detection Summary");
  lines.push("");
  const heuristicRows = sortedEntries(heuristicCounts).map(([id, count]) => [
    HEURISTIC_LABELS[id] ?? id,
    formatInt(count),
    formatPercent(count, totalTx),
  ]);
  lines.push(markdownTable(["Heuristic", "Detections", "Rate"], heuristicRows));
  lines.push("");

  const classificationCounts = computeClassificationCounts(allTxs);

  lines.push("### Transaction Classification Summary");
  lines.push("");
  const classRows = sortedEntries(classificationCounts).map(([cls, count]) => [
    CLASSIFICATION_LABELS[cls] ?? cls,
    formatInt(count),
    formatPercent(count, totalTx),
  ]);
  lines.push(markdownTable(["Classification", "Count", "Share"], classRows));
  lines.push("");
}

function appendBlockSections(lines: string[], report: ChainAnalysisReport): void {
  for (const block of report.blocks) {
    lines.push("---");
    lines.push("");
    appendSingleBlock(lines, block);
  }
}

function appendSingleBlock(lines: string[], block: BlockAnalysis): void {
  const s = block.analysis_summary;
  const flaggedPct = formatPercent(s.flagged_transactions, block.tx_count);

  lines.push(`## Block ${formatInt(block.block_height)}`);
  lines.push("");
  lines.push(
    `**Hash:** \`${block.block_hash}\` | ` +
    `**Timestamp:** ${formatTimestamp(block.block_timestamp)} | ` +
    `**Transactions:** ${formatInt(block.tx_count)} | ` +
    `**Flagged:** ${formatInt(s.flagged_transactions)} (${flaggedPct})`,
  );
  lines.push("");

  lines.push("### Fee Rate Statistics");
  lines.push("");
  lines.push(feeRateTable(s.fee_rate_stats));
  lines.push("");

  const heuristicCounts = computeHeuristicCounts(block.transactions);
  lines.push("### Heuristic Findings");
  lines.push("");
  const hRows = sortedEntries(heuristicCounts).map(([id, count]) => [
    HEURISTIC_LABELS[id] ?? id,
    formatInt(count),
    formatPercent(count, block.tx_count),
  ]);
  lines.push(markdownTable(["Heuristic", "Detections", "Rate"], hRows));
  lines.push("");

  const classificationCounts = computeClassificationCounts(block.transactions);
  lines.push("### Transaction Classifications");
  lines.push("");
  const cRows = sortedEntries(classificationCounts).map(([cls, count]) => [
    CLASSIFICATION_LABELS[cls] ?? cls,
    formatInt(count),
    formatPercent(count, block.tx_count),
  ]);
  lines.push(markdownTable(["Classification", "Count", "Share"], cRows));
  lines.push("");

  const notable = selectNotableTransactions(block.transactions);
  if (notable.length > 0) {
    lines.push("### Notable Transactions");
    lines.push("");
    const nRows = notable.map(tx => [
      `\`${truncateTxid(tx.txid)}\``,
      CLASSIFICATION_LABELS[tx.classification] ?? tx.classification,
      Object.keys(tx.heuristics).map(id => HEURISTIC_LABELS[id] ?? id).join(", "),
    ]);
    lines.push(markdownTable(["TXID", "Classification", "Detected Heuristics"], nRows));
    lines.push("");
  }
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function computeHeuristicCounts(
  txs: TransactionAnalysis[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of txs) {
    for (const id of Object.keys(tx.heuristics)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

function computeClassificationCounts(
  txs: TransactionAnalysis[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of txs) {
    counts.set(tx.classification, (counts.get(tx.classification) ?? 0) + 1);
  }
  return counts;
}

function selectNotableTransactions(
  txs: TransactionAnalysis[],
): TransactionAnalysis[] {
  const interesting = txs.filter(tx =>
    tx.classification === "coinjoin" ||
    tx.classification === "consolidation" ||
    tx.classification === "self_transfer" ||
    Object.keys(tx.heuristics).length >= 4,
  );

  interesting.sort((a, b) => {
    const priority = classificationPriority(a.classification) - classificationPriority(b.classification);
    if (priority !== 0) return priority;
    return Object.keys(b.heuristics).length - Object.keys(a.heuristics).length;
  });

  return interesting.slice(0, NOTABLE_TX_LIMIT);
}

function classificationPriority(cls: string): number {
  switch (cls) {
    case "coinjoin": return 0;
    case "consolidation": return 1;
    case "self_transfer": return 2;
    default: return 3;
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function feeRateTable(stats: FeeRateStats): string {
  return markdownTable(
    ["Metric", "sat/vB"],
    [
      ["Minimum", formatDecimal(stats.min_sat_vb)],
      ["Maximum", formatDecimal(stats.max_sat_vb)],
      ["Median", formatDecimal(stats.median_sat_vb)],
      ["Mean", formatDecimal(stats.mean_sat_vb)],
    ],
  );
}

function scriptTypeTable(dist: ScriptTypeDistribution): string {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, c]) => s + c, 0);
  const rows = entries.map(([type, count]) => [
    `\`${type}\``,
    formatInt(count),
    formatPercent(count, total),
  ]);
  return markdownTable(["Script Type", "Count", "Share"], rows);
}

function markdownTable(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) {
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines.join("\n");
}

function formatInt(n: number): string {
  if (n < 0) return "-" + formatInt(-n);
  const s = Math.floor(n).toString();
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return parts.join(",");
}

function formatDecimal(n: number): string {
  const int = Math.floor(Math.abs(n));
  const frac = Math.abs(n) - int;
  const fracStr = (Math.round(frac * 100) / 100).toFixed(2).slice(1);
  const sign = n < 0 ? "-" : "";
  return sign + formatInt(int) + fracStr;
}

function formatPercent(part: number, total: number): string {
  if (total === 0) return "0.0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

function formatTimestamp(unix: number): string {
  const d = new Date(unix * 1000);
  const y = d.getUTCFullYear();
  const mo = pad2(d.getUTCMonth() + 1);
  const da = pad2(d.getUTCDate());
  const h = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const s = pad2(d.getUTCSeconds());
  return `${y}-${mo}-${da} ${h}:${mi}:${s} UTC`;
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function truncateTxid(txid: string): string {
  return txid.length > 16 ? txid.slice(0, 16) + "..." : txid;
}

function sortedEntries(map: Map<string, number>): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
