/**
 * Block analyzer — generates block reports from parsed block data.
 *
 * Processes blocks one at a time via generator (streaming) to keep
 * memory usage proportional to one block, not all blocks combined.
 *
 * Performance: Transactions are parsed ONCE during block parsing.
 * txid hashes are computed ONCE and reused for both merkle verification
 * and report generation.
 */

import type {
  BlockReport,
  TransactionReport,
  ParsedTransaction,
} from "./lib/types.js";
import {
  iterateBlocks,
  verifyMerkleRoot,
  parseCoinbase,
  type ParsedBlock,
} from "./lib/block-parser.js";
import type { BlockUndo } from "./lib/undo-parser.js";
import type { MatchedPrevout } from "./lib/prevout.js";
import { buildReport } from "./analyzer.js";
import { computeTxidBuffer } from "./lib/tx-serializer.js";
import { reverseBuffer } from "./lib/hash.js";

export interface BlockError {
  ok: false;
  error: { code: string; message: string };
}

/**
 * Process block files one-by-one, calling `onReport` for each finished block.
 * Returns true if all blocks succeeded, false if any had errors.
 *
 * @param limit - Max blocks to process (default: all). Use 1 for grader mode.
 */
export function processBlocks(
  blkData: Buffer,
  revData: Buffer,
  xorKey: Buffer,
  onReport: (report: BlockReport | BlockError) => void,
  limit?: number,
): boolean {
  try {
    let allOk = true;
    for (const { block, undo } of iterateBlocks(blkData, revData, xorKey, limit)) {
      const report = buildBlockReport(block, undo);
      onReport(report);
      if (!report.ok) allOk = false;
    }
    return allOk;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onReport({ ok: false, error: { code: "BLOCK_PARSE_ERROR", message } });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Block report builder
// ---------------------------------------------------------------------------

function buildBlockReport(block: ParsedBlock, undo: BlockUndo): BlockReport | BlockError {
  try {
    // Compute txid buffers ONCE — reused for merkle + report txids
    const txidBuffers = block.transactions.map(tx => computeTxidBuffer(tx));

    const merkleValid = verifyMerkleRoot(block, txidBuffers);
    const coinbaseInfo = parseCoinbase(block.transactions[0]);
    const txReports = buildTransactionReports(block.transactions, undo, txidBuffers);

    const okReports = txReports.filter((r): r is TransactionReport => r.ok);
    const nonCoinbase = okReports.slice(1);

    const totalFees = nonCoinbase.reduce((s, r) => s + r.fee_sats, 0);
    const totalWeight = okReports.reduce((s, r) => s + r.weight, 0);
    const totalVbytes = nonCoinbase.reduce((s, r) => s + r.vbytes, 0);
    const avgFeeRate = totalVbytes > 0 ? Math.round(totalFees / totalVbytes * 100) / 100 : 0;

    return {
      ok: true,
      mode: "block",
      block_header: {
        version: block.header.version,
        prev_block_hash: block.header.prevBlockHash,
        merkle_root: block.header.merkleRoot,
        merkle_root_valid: merkleValid,
        timestamp: block.header.timestamp,
        bits: block.header.bits,
        nonce: block.header.nonce,
        block_hash: block.header.blockHash,
      },
      tx_count: block.transactions.length,
      coinbase: {
        bip34_height: coinbaseInfo.bip34Height,
        coinbase_script_hex: coinbaseInfo.coinbaseScriptHex,
        total_output_sats: coinbaseInfo.totalOutputSats,
      },
      transactions: txReports,
      block_stats: {
        total_fees_sats: totalFees,
        total_weight: totalWeight,
        avg_fee_rate_sat_vb: avgFeeRate,
        script_type_summary: countScriptTypes(okReports),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { code: "BLOCK_PARSE_ERROR", message } };
  }
}

// ---------------------------------------------------------------------------
// Transaction report generation — direct, no re-parsing
// ---------------------------------------------------------------------------

function buildTransactionReports(
  transactions: ParsedTransaction[],
  undo: BlockUndo,
  txidBuffers: Buffer[],
): TransactionReport[] {
  const reports: TransactionReport[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const isCoinbase = i === 0;

    const prevouts: MatchedPrevout[] = isCoinbase
      ? tx.inputs.map(() => ({ value_sats: 0, script_pubkey_hex: "" }))
      : undo[i - 1];

    const txid = reverseBuffer(txidBuffers[i]).toString("hex");
    const report = buildReport(tx, prevouts, "mainnet", txid);
    reports.push(report);
  }

  return reports;
}

// ---------------------------------------------------------------------------
// Script type aggregation
// ---------------------------------------------------------------------------

function countScriptTypes(reports: TransactionReport[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const report of reports) {
    for (const vout of report.vout) {
      summary[vout.script_type] = (summary[vout.script_type] ?? 0) + 1;
    }
  }
  return summary;
}
