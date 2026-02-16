/**
 * Transaction analyzer — orchestrates parsing and report generation.
 */

import type {
  Fixture,
  TransactionReport,
  SegwitSavings,
  VinEntry,
  VoutEntry,
  Warning,
  LocktimeType,
  RelativeTimelock,
  ErrorReport,
  CliOutput,
  ParsedTransaction,
} from "./lib/types.js";
import { parseTransaction } from "./lib/tx-parser.js";
import { matchPrevouts, type MatchedPrevout } from "./lib/prevout.js";
import { computeTxid, computeWtxid } from "./lib/tx-serializer.js";
import { classifyOutputScript, classifyInputScript, disassembleScript, parseOpReturnPayload } from "./lib/script.js";
import { deriveAddress } from "./lib/address.js";

export function analyzeTransaction(fixture: Fixture): CliOutput {
  try {
    const parsed = parseTransaction(fixture.raw_tx);
    const prevouts = matchPrevouts(parsed.inputs, fixture.prevouts);
    return buildReport(parsed, prevouts, fixture.network);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { code: "INVALID_TX", message } } satisfies ErrorReport;
  }
}

// ---------------------------------------------------------------------------
// Report builder
// ---------------------------------------------------------------------------

function buildReport(
  tx: ParsedTransaction,
  prevouts: MatchedPrevout[],
  network: string,
): TransactionReport {
  const txid = computeTxid(tx);
  const wtxid = computeWtxid(tx);

  const sizeBytes = tx.rawBuffer.length;
  const weight = computeWeight(tx);
  const vbytes = Math.ceil(weight / 4);

  const totalInputSats = prevouts.reduce((s, p) => s + p.value_sats, 0);
  const totalOutputSats = tx.outputs.reduce((s, o) => s + Number(o.value), 0);
  const feeSats = totalInputSats - totalOutputSats;
  const feeRate = round2(feeSats / vbytes);

  const rbfSignaling = detectRbf(tx);
  const { type: locktimeType, value: locktimeValue } = classifyLocktime(tx.locktime);

  const vin = buildVin(tx, prevouts, network);
  const vout = buildVout(tx, network);
  const segwitSavings = tx.segwit ? computeSegwitSavings(tx, weight) : null;
  const warnings = detectWarnings(feeSats, feeRate, rbfSignaling, vout);

  return {
    ok: true,
    network,
    segwit: tx.segwit,
    txid,
    wtxid,
    version: tx.version,
    locktime: tx.locktime,
    size_bytes: sizeBytes,
    weight,
    vbytes,
    total_input_sats: totalInputSats,
    total_output_sats: totalOutputSats,
    fee_sats: feeSats,
    fee_rate_sat_vb: feeRate,
    rbf_signaling: rbfSignaling,
    locktime_type: locktimeType,
    locktime_value: locktimeValue,
    segwit_savings: segwitSavings,
    vin,
    vout,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Weight & SegWit savings
// ---------------------------------------------------------------------------

function computeWeight(tx: ParsedTransaction): number {
  return tx.nonWitnessBytes * 4 + tx.witnessBytes;
}

function computeSegwitSavings(tx: ParsedTransaction, weightActual: number): SegwitSavings {
  const totalBytes = tx.rawBuffer.length;
  const weightIfLegacy = totalBytes * 4;
  const savingsPct = round2((1 - weightActual / weightIfLegacy) * 100);

  return {
    witness_bytes: tx.witnessBytes,
    non_witness_bytes: tx.nonWitnessBytes,
    total_bytes: totalBytes,
    weight_actual: weightActual,
    weight_if_legacy: weightIfLegacy,
    savings_pct: savingsPct,
  };
}

// ---------------------------------------------------------------------------
// RBF detection (BIP125)
// ---------------------------------------------------------------------------

function detectRbf(tx: ParsedTransaction): boolean {
  return tx.inputs.some(input => input.sequence < 0xfffffffe);
}

// ---------------------------------------------------------------------------
// Locktime classification
// ---------------------------------------------------------------------------

function classifyLocktime(locktime: number): { type: LocktimeType; value: number } {
  if (locktime === 0) return { type: "none", value: 0 };
  if (locktime < 500_000_000) return { type: "block_height", value: locktime };
  return { type: "unix_timestamp", value: locktime };
}

// ---------------------------------------------------------------------------
// Relative timelock (BIP68)
// ---------------------------------------------------------------------------

function decodeRelativeTimelock(sequence: number): RelativeTimelock {
  if (sequence & 0x80000000) return { enabled: false };

  const masked = sequence & 0xffff;

  if (sequence & 0x00400000) {
    return { enabled: true, type: "time", value: masked * 512 };
  }
  return { enabled: true, type: "blocks", value: masked };
}

// ---------------------------------------------------------------------------
// vin[] builder
// ---------------------------------------------------------------------------

function buildVin(tx: ParsedTransaction, prevouts: MatchedPrevout[], network: string): VinEntry[] {
  return tx.inputs.map((input, i) => {
    const prevout = prevouts[i];
    const witnessItems = tx.witness[i] ?? [];
    const witnessHex = witnessItems.map(w => w.toString("hex"));
    const scriptSigHex = input.scriptSig.toString("hex");

    const scriptType = classifyInputScript(prevout.script_pubkey_hex, scriptSigHex, witnessHex);
    const prevoutOutputType = classifyOutputScript(prevout.script_pubkey_hex);
    const address = deriveAddress(prevout.script_pubkey_hex, prevoutOutputType, network);

    const entry: VinEntry = {
      txid: input.txid,
      vout: input.vout,
      sequence: input.sequence,
      script_sig_hex: scriptSigHex,
      script_asm: disassembleScript(scriptSigHex),
      witness: witnessHex,
      script_type: scriptType,
      address,
      prevout: {
        value_sats: prevout.value_sats,
        script_pubkey_hex: prevout.script_pubkey_hex,
      },
      relative_timelock: decodeRelativeTimelock(input.sequence),
    };

    // witness_script_asm for p2wsh and p2sh-p2wsh (last witness item is the witnessScript)
    if ((scriptType === "p2wsh" || scriptType === "p2sh-p2wsh") && witnessHex.length > 0) {
      entry.witness_script_asm = disassembleScript(witnessHex[witnessHex.length - 1]);
    }

    return entry;
  });
}

// ---------------------------------------------------------------------------
// vout[] builder
// ---------------------------------------------------------------------------

function buildVout(tx: ParsedTransaction, network: string): VoutEntry[] {
  return tx.outputs.map((output, i) => {
    const scriptHex = output.scriptPubKey.toString("hex");
    const scriptType = classifyOutputScript(scriptHex);
    const address = deriveAddress(scriptHex, scriptType, network);

    const entry: VoutEntry = {
      n: i,
      value_sats: Number(output.value),
      script_pubkey_hex: scriptHex,
      script_asm: disassembleScript(scriptHex),
      script_type: scriptType,
      address,
    };

    if (scriptType === "op_return") {
      const opReturn = parseOpReturnPayload(scriptHex);
      entry.op_return_data_hex = opReturn.op_return_data_hex;
      entry.op_return_data_utf8 = opReturn.op_return_data_utf8;
      entry.op_return_protocol = opReturn.op_return_protocol;
    }

    return entry;
  });
}

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

function detectWarnings(
  feeSats: number,
  feeRate: number,
  rbfSignaling: boolean,
  vout: VoutEntry[],
): Warning[] {
  const warnings: Warning[] = [];

  if (feeSats > 1_000_000 || feeRate > 200) {
    warnings.push({ code: "HIGH_FEE" });
  }
  if (vout.some(o => o.script_type !== "op_return" && o.value_sats < 546)) {
    warnings.push({ code: "DUST_OUTPUT" });
  }
  if (vout.some(o => o.script_type === "unknown")) {
    warnings.push({ code: "UNKNOWN_OUTPUT_SCRIPT" });
  }
  if (rbfSignaling) {
    warnings.push({ code: "RBF_SIGNALING" });
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
