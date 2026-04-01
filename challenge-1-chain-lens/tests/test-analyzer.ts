/**
 * Full analyzer pipeline — txid, fees, weight, warnings, timelocks.
 *
 * Why: Integration tests that validate the entire chain from raw hex to
 * final JSON report. Cross-checks field consistency (fee = in - out,
 * vbytes = ceil(weight/4), RBF warning ↔ rbf_signaling, etc.).
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { analyzeTransaction } from "../src/analyzer.js";
import { describe, test, assertEqual, assert } from "./helpers.js";
import type { Fixture, TransactionReport } from "../src/lib/types.js";

const fixturesDir = "fixtures/transactions";
const expectedDir = "grader/expected/transactions";

interface ExpectedValues {
  txid?: string;
  wtxid?: string | null;
  size_bytes?: number;
  weight?: number;
  vbytes?: number;
  fee_sats?: number;
  fee_rate_sat_vb?: number;
  total_input_sats?: number;
  total_output_sats?: number;
  rbf_signaling?: boolean;
  segwit?: boolean;
  locktime_type?: string;
  vin_count?: number;
  vout_count?: number;
  vout_script_types?: string[];
}

const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith(".json"));

// ---------------------------------------------------------------------------
// Per-fixture validation against grader expected values
// ---------------------------------------------------------------------------

describe("Analyzer: fixture validation", () => {
  for (const file of fixtureFiles) {
    const name = file.replace(".json", "");
    const fixture: Fixture = JSON.parse(readFileSync(`${fixturesDir}/${file}`, "utf-8"));
    const expectedPath = `${expectedDir}/${file}`;
    const expected: ExpectedValues = existsSync(expectedPath)
      ? JSON.parse(readFileSync(expectedPath, "utf-8"))
      : {};

    const result = analyzeTransaction(fixture);

    test(`${name}: ok === true`, () =>
      assert(result.ok === true, `Expected ok=true, got ${result.ok}`));

    if (!result.ok) continue;
    const report = result as TransactionReport;

    if (expected.txid) {
      test(`${name}: txid`, () => assertEqual(report.txid, expected.txid!));
    }
    if ("wtxid" in expected) {
      test(`${name}: wtxid`, () => assertEqual(report.wtxid, expected.wtxid!));
    }
    if (expected.size_bytes !== undefined) {
      test(`${name}: size_bytes`, () => assertEqual(report.size_bytes, expected.size_bytes!));
    }
    if (expected.weight !== undefined) {
      test(`${name}: weight`, () => assertEqual(report.weight, expected.weight!));
    }
    if (expected.vbytes !== undefined) {
      test(`${name}: vbytes`, () => assertEqual(report.vbytes, expected.vbytes!));
    }
    if (expected.fee_sats !== undefined) {
      test(`${name}: fee_sats`, () => assertEqual(report.fee_sats, expected.fee_sats!));
    }
    if (expected.total_input_sats !== undefined) {
      test(`${name}: total_input_sats`, () => assertEqual(report.total_input_sats, expected.total_input_sats!));
    }
    if (expected.total_output_sats !== undefined) {
      test(`${name}: total_output_sats`, () => assertEqual(report.total_output_sats, expected.total_output_sats!));
    }
    if (expected.fee_rate_sat_vb !== undefined) {
      test(`${name}: fee_rate_sat_vb`, () => {
        const diff = Math.abs(report.fee_rate_sat_vb - expected.fee_rate_sat_vb!);
        assert(diff < 0.02, `fee_rate off by ${diff}`);
      });
    }
    if (expected.rbf_signaling !== undefined) {
      test(`${name}: rbf_signaling`, () => assertEqual(report.rbf_signaling, expected.rbf_signaling!));
    }
    if (expected.locktime_type !== undefined) {
      test(`${name}: locktime_type`, () => assertEqual(report.locktime_type, expected.locktime_type!));
    }
    if (expected.vin_count !== undefined) {
      test(`${name}: vin_count`, () => assertEqual(report.vin.length, expected.vin_count!));
    }
    if (expected.vout_count !== undefined) {
      test(`${name}: vout_count`, () => assertEqual(report.vout.length, expected.vout_count!));
    }
    if (expected.vout_script_types) {
      test(`${name}: vout_script_types`, () => {
        const actual = report.vout.map(v => v.script_type).sort();
        const exp = [...expected.vout_script_types!].sort();
        assertEqual(JSON.stringify(actual), JSON.stringify(exp));
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Cross-field consistency (invariants that must hold for ANY transaction)
// ---------------------------------------------------------------------------

describe("Analyzer: cross-field consistency", () => {
  for (const file of fixtureFiles) {
    const name = file.replace(".json", "");
    const fixture: Fixture = JSON.parse(readFileSync(`${fixturesDir}/${file}`, "utf-8"));
    const result = analyzeTransaction(fixture);
    if (!result.ok) continue;
    const report = result as TransactionReport;

    test(`${name}: fee = input - output`, () =>
      assertEqual(report.fee_sats, report.total_input_sats - report.total_output_sats));

    test(`${name}: vbytes = ceil(weight/4)`, () =>
      assertEqual(report.vbytes, Math.ceil(report.weight / 4)));

    if (report.segwit && report.segwit_savings) {
      test(`${name}: segwit_savings.total_bytes = size_bytes`, () =>
        assertEqual(report.segwit_savings!.total_bytes, report.size_bytes));

      test(`${name}: segwit_savings.weight_actual = weight`, () =>
        assertEqual(report.segwit_savings!.weight_actual, report.weight));
    }

    test(`${name}: RBF warning ↔ rbf_signaling`, () => {
      const hasWarning = report.warnings.some(w => w.code === "RBF_SIGNALING");
      assertEqual(hasWarning, report.rbf_signaling);
    });
  }
});
