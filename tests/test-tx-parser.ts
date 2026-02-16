/**
 * Transaction parser tests.
 * Verifies parsing, byte metrics, and error handling against grader fixtures.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { parseTransaction } from "../src/lib/tx-parser.js";
import { test, assertEqual, assert, assertThrows } from "./helpers.js";
import type { Fixture } from "../src/lib/types.js";

const fixtureDir = "fixtures/transactions";
const expectedDir = "grader/expected/transactions";

// --- Fixture validation (size, weight, vbytes, segwit, version, counts) ---

for (const file of readdirSync(fixtureDir).filter(f => f.endsWith(".json"))) {
  const name = file.replace(".json", "");
  const expPath = `${expectedDir}/${name}.json`;
  if (!existsSync(expPath)) continue;

  const fixture: Fixture = JSON.parse(readFileSync(`${fixtureDir}/${file}`, "utf-8"));
  const expected = JSON.parse(readFileSync(expPath, "utf-8"));
  const parsed = parseTransaction(fixture.raw_tx);
  const weight = parsed.nonWitnessBytes * 4 + parsed.witnessBytes;

  test(`${name} size_bytes`, () => assertEqual(parsed.rawBuffer.length, expected.size_bytes));
  test(`${name} weight`, () => assertEqual(weight, expected.weight));
  test(`${name} vbytes`, () => assertEqual(Math.ceil(weight / 4), expected.vbytes));
  test(`${name} segwit`, () => assertEqual(parsed.segwit, expected.segwit));
  test(`${name} version`, () => assertEqual(parsed.version, expected.version));

  if (expected.vin_count !== undefined) {
    test(`${name} vin_count`, () => assertEqual(parsed.inputs.length, expected.vin_count));
  }
  if (expected.vout_count !== undefined) {
    test(`${name} vout_count`, () => assertEqual(parsed.outputs.length, expected.vout_count));
  }
}

// --- SegWit byte metrics ---

test("segwit: nonWitness + witness = total", () => {
  const f: Fixture = JSON.parse(readFileSync(`${fixtureDir}/multi_input_segwit.json`, "utf-8"));
  const p = parseTransaction(f.raw_tx);
  assertEqual(p.nonWitnessBytes + p.witnessBytes, p.rawBuffer.length);
  assert(p.witnessBytes > 0, "segwit witness should be > 0");
});

test("legacy: witness = 0, nonWitness = total", () => {
  const f: Fixture = JSON.parse(readFileSync(`${fixtureDir}/tx_legacy_p2pkh.json`, "utf-8"));
  const p = parseTransaction(f.raw_tx);
  assertEqual(p.witnessBytes, 0);
  assertEqual(p.nonWitnessBytes, p.rawBuffer.length);
});

// --- Error handling ---

test("rejects empty input", () => assertThrows(() => parseTransaction("")));
test("rejects truncated tx", () => assertThrows(() => parseTransaction("02000000")));
test("rejects invalid hex", () => assertThrows(() => parseTransaction("zzzzzzzz")));
