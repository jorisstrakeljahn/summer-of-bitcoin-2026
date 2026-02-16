/**
 * Transaction analyzer — orchestrates parsing, classification, and report generation.
 *
 * Takes a fixture JSON and produces the full TransactionReport.
 */

import type {
  Fixture,
  TransactionReport,
  ErrorReport,
  CliOutput,
} from "./lib/types.js";
import { parseTransaction } from "./lib/tx-parser.js";

export function analyzeTransaction(fixture: Fixture): CliOutput {
  try {
    const parsed = parseTransaction(fixture.raw_tx);

    // TODO: Match prevouts to inputs
    // TODO: Compute txid, wtxid
    // TODO: Compute fees, weight, vbytes
    // TODO: Classify scripts, derive addresses
    // TODO: Detect RBF, timelocks
    // TODO: Generate warnings
    // TODO: Build full report

    // Placeholder — will be replaced with actual implementation
    const report: TransactionReport = {
      ok: true,
      network: fixture.network,
      segwit: parsed.segwit,
      txid: "",
      wtxid: null,
      version: parsed.version,
      locktime: parsed.locktime,
      size_bytes: 0,
      weight: 0,
      vbytes: 0,
      total_input_sats: 0,
      total_output_sats: 0,
      fee_sats: 0,
      fee_rate_sat_vb: 0,
      rbf_signaling: false,
      locktime_type: "none",
      locktime_value: parsed.locktime,
      segwit_savings: null,
      vin: [],
      vout: [],
      warnings: [],
    };

    return report;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorReport: ErrorReport = {
      ok: false,
      error: {
        code: "INVALID_TX",
        message,
      },
    };
    return errorReport;
  }
}
