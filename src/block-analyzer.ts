/**
 * Block analyzer — generates block reports from parsed block data.
 *
 * Processes blocks one at a time via generator (streaming) to keep
 * memory usage proportional to one block, not all blocks combined.
 */

import type {
  BlockReport,
  TransactionReport,
  Fixture,
  ParsedTransaction,
} from "./lib/types.js";
import {
  iterateBlocks,
  verifyMerkleRoot,
  parseCoinbase,
  type ParsedBlock,
} from "./lib/block-parser.js";
import type { BlockUndo } from "./lib/undo-parser.js";
import { analyzeTransaction } from "./analyzer.js";

export interface BlockError {
  ok: false;
  error: { code: string; message: string };
}

/**
 * Process block files one-by-one, calling `onReport` for each finished block.
 * Returns true if all blocks succeeded, false if any had errors.
 */
export function processBlocks(
  blkData: Buffer,
  revData: Buffer,
  xorKey: Buffer,
  onReport: (report: BlockReport | BlockError) => void,
): boolean {
  try {
    let allOk = true;
    for (const { block, undo } of iterateBlocks(blkData, revData, xorKey)) {
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
    const merkleValid = verifyMerkleRoot(block);
    const coinbaseInfo = parseCoinbase(block.transactions[0]);
    const txReports = buildTransactionReports(block.transactions, undo);

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
// Transaction report generation
// ---------------------------------------------------------------------------

function buildTransactionReports(
  transactions: ParsedTransaction[],
  undo: BlockUndo,
): TransactionReport[] {
  const reports: TransactionReport[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const isCoinbase = i === 0;

    const fixture: Fixture = {
      network: "mainnet",
      raw_tx: tx.rawHex,
      prevouts: isCoinbase
        ? buildCoinbasePrevouts(tx)
        : buildUndoPrevouts(tx, undo[i - 1]),
    };

    const result = analyzeTransaction(fixture);
    if (result.ok) {
      reports.push(result);
    }
  }

  return reports;
}

function buildCoinbasePrevouts(tx: ParsedTransaction) {
  return tx.inputs.map(input => ({
    txid: input.txid,
    vout: input.vout,
    value_sats: 0,
    script_pubkey_hex: "",
  }));
}

function buildUndoPrevouts(tx: ParsedTransaction, undoPrevouts: BlockUndo[number]) {
  return tx.inputs.map((input, i) => ({
    txid: input.txid,
    vout: input.vout,
    value_sats: undoPrevouts[i].value_sats,
    script_pubkey_hex: undoPrevouts[i].script_pubkey_hex,
  }));
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
