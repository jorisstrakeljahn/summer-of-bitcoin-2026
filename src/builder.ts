/**
 * Build pipeline orchestrator.
 *
 * Transforms a raw fixture JSON into a complete build report by
 * executing the following stages:
 *
 *   1. Validate — Parse and defensively validate the fixture input
 *   2. Select  — Run all coin selection strategies, pick lowest fee
 *   3. Resolve — Determine nSequence and nLockTime from RBF/locktime fields
 *   4. Build   — Construct the unsigned PSBT with bitcoinjs-lib
 *   5. Warn    — Detect safety warnings (HIGH_FEE, SEND_ALL, etc.)
 *   6. Report  — Assemble the JSON output with all required fields
 *
 * On error at any stage, returns a structured error object instead of
 * throwing. This guarantees the CLI can always write valid JSON output.
 */

import type { Fixture, BuildResult } from "./types";
import { parseFixture, ValidationError } from "./validation";
import { selectCoins, selectCoinsAllStrategies } from "./coin-selection/index";
import { computeRbfLocktime } from "./rbf-locktime";
import { buildPsbt } from "./psbt-builder";
import { detectWarnings } from "./warnings";
import { InsufficientFundsError } from "./fee-calculator";

export function build(fixtureRaw: unknown): BuildResult {
  let fixture: Fixture;

  try {
    fixture = parseFixture(fixtureRaw);
  } catch (e) {
    if (e instanceof ValidationError) {
      return { ok: false, error: { code: e.code, message: e.message } };
    }
    return { ok: false, error: { code: "INVALID_FIXTURE", message: String(e) } };
  }

  try {
    const coinResult = selectCoins({
      utxos: fixture.utxos,
      payments: fixture.payments,
      change: fixture.change,
      feeRate: fixture.fee_rate_sat_vb,
      maxInputs: fixture.policy?.max_inputs,
    });

    const rbfLocktime = computeRbfLocktime(fixture);

    const { psbtBase64, outputs } = buildPsbt({
      network: fixture.network,
      selectedInputs: coinResult.selectedUtxos,
      payments: fixture.payments,
      change: coinResult.changeAmount !== null ? fixture.change : null,
      changeAmount: coinResult.changeAmount,
      nSequence: rbfLocktime.nSequence,
      nLockTime: rbfLocktime.nLockTime,
    });

    const feeRate = Math.round((coinResult.fee / coinResult.vbytes) * 100) / 100;
    const changeIndex = coinResult.changeAmount !== null
      ? outputs.findIndex((o) => o.is_change)
      : null;

    const warnings = detectWarnings({
      feeSats: coinResult.fee,
      feeRateSatVb: feeRate,
      changeAmount: coinResult.changeAmount,
      rbfSignaling: rbfLocktime.rbfSignaling,
    });

    return {
      ok: true,
      network: fixture.network,
      strategy: coinResult.strategyName,
      selected_inputs: coinResult.selectedUtxos,
      outputs,
      change_index: changeIndex !== -1 ? changeIndex : null,
      fee_sats: coinResult.fee,
      fee_rate_sat_vb: feeRate,
      vbytes: coinResult.vbytes,
      rbf_signaling: rbfLocktime.rbfSignaling,
      locktime: rbfLocktime.nLockTime,
      locktime_type: rbfLocktime.locktimeType,
      psbt_base64: psbtBase64,
      warnings,
    };
  } catch (e) {
    if (e instanceof InsufficientFundsError) {
      return { ok: false, error: { code: e.code, message: e.message } };
    }
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { code: "BUILD_ERROR", message } };
  }
}

// ── Web API helper ─────────────────────────────────────────────────

export interface StrategySummary {
  name: string;
  fee: number;
  vbytes: number;
  inputCount: number;
  hasChange: boolean;
}

/**
 * Runs the build pipeline and additionally returns results from all
 * coin selection strategies for comparison in the web UI.
 */
export function buildWithStrategies(
  fixtureRaw: unknown,
): { result: BuildResult; strategies: StrategySummary[] } {
  const result = build(fixtureRaw);

  let strategies: StrategySummary[] = [];
  try {
    const fixture = parseFixture(fixtureRaw);
    const allResults = selectCoinsAllStrategies({
      utxos: fixture.utxos,
      payments: fixture.payments,
      change: fixture.change,
      feeRate: fixture.fee_rate_sat_vb,
      maxInputs: fixture.policy?.max_inputs,
    });
    strategies = allResults.map((r) => ({
      name: r.strategyName,
      fee: r.fee,
      vbytes: r.vbytes,
      inputCount: r.selectedUtxos.length,
      hasChange: r.changeAmount !== null,
    }));
  } catch {
    /* strategies stay empty on validation/selection error */
  }

  return { result, strategies };
}
