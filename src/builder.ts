import type { Fixture, BuildResult } from "./types.js";
import { parseFixture, ValidationError } from "./validation.js";
import { selectCoins } from "./coin-selection/index.js";
import { computeRbfLocktime } from "./rbf-locktime.js";
import { buildPsbt } from "./psbt-builder.js";
import { detectWarnings } from "./warnings.js";
import { InsufficientFundsError } from "./fee-calculator.js";

export function build(fixtureRaw: unknown): BuildResult {
  let fixture: Fixture;

  try {
    fixture = parseFixture(fixtureRaw);
  } catch (e) {
    if (e instanceof ValidationError) {
      return {
        ok: false,
        error: { code: e.code, message: e.message },
      };
    }
    return {
      ok: false,
      error: { code: "INVALID_FIXTURE", message: String(e) },
    };
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

    const feeRateSatVb = coinResult.fee / coinResult.vbytes;
    const changeIndex = coinResult.changeAmount !== null
      ? outputs.findIndex((o) => o.is_change)
      : null;

    const warnings = detectWarnings({
      feeSats: coinResult.fee,
      feeRateSatVb: feeRateSatVb,
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
      fee_rate_sat_vb: Math.round(feeRateSatVb * 100) / 100,
      vbytes: coinResult.vbytes,
      rbf_signaling: rbfLocktime.rbfSignaling,
      locktime: rbfLocktime.nLockTime,
      locktime_type: rbfLocktime.locktimeType,
      psbt_base64: psbtBase64,
      warnings,
    };
  } catch (e) {
    if (e instanceof InsufficientFundsError) {
      return {
        ok: false,
        error: { code: e.code, message: e.message },
      };
    }
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: { code: "BUILD_ERROR", message },
    };
  }
}
