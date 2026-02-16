/**
 * Quick test: parse all transaction fixtures and verify key fields.
 * Run with: npx tsx src/test-parser.ts
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { parseTransaction } from "./lib/tx-parser.js";
import { matchPrevouts } from "./lib/prevout.js";
import type { Fixture } from "./lib/types.js";

const fixturesDir = "fixtures/transactions";
const expectedDir = "grader/expected/transactions";
const files = readdirSync(fixturesDir).filter(f => f.endsWith(".json"));

let passed = 0;
let failed = 0;

for (const file of files) {
  const name = file.replace(".json", "");
  const fixture: Fixture = JSON.parse(readFileSync(`${fixturesDir}/${file}`, "utf-8"));

  try {
    const parsed = parseTransaction(fixture.raw_tx);
    const prevouts = matchPrevouts(parsed.inputs, fixture.prevouts);

    // Compute metrics
    const weight = parsed.nonWitnessBytes * 4 + parsed.witnessBytes;
    const vbytes = Math.ceil(weight / 4);
    const totalInput = prevouts.reduce((sum, p) => sum + p.value_sats, 0);
    const totalOutput = parsed.outputs.reduce((sum, o) => sum + Number(o.value), 0);
    const fee = totalInput - totalOutput;

    // Check against expected values
    const expectedPath = `${expectedDir}/${name}.json`;
    if (existsSync(expectedPath)) {
      const expected = JSON.parse(readFileSync(expectedPath, "utf-8"));
      const checks = [
        ["size_bytes", parsed.rawBuffer.length, expected.size_bytes],
        ["weight", weight, expected.weight],
        ["vbytes", vbytes, expected.vbytes],
        ["fee_sats", fee, expected.fee_sats],
        ["total_input", totalInput, expected.total_input_sats],
        ["total_output", totalOutput, expected.total_output_sats],
        ["segwit", parsed.segwit, expected.segwit],
        ["version", parsed.version, expected.version],
      ] as const;

      const failures = checks.filter(([, actual, exp]) => actual !== exp);

      if (failures.length === 0) {
        console.log(`✓ ${name}: all checks pass`);
        passed++;
      } else {
        console.log(`✗ ${name}:`);
        for (const [label, actual, exp] of failures) {
          console.log(`  FAIL ${label}: got ${actual}, expected ${exp}`);
        }
        failed++;
      }
    } else {
      console.log(`? ${name}: no expected file (parsed OK)`);
      passed++;
    }
  } catch (e) {
    console.log(`✗ ${name}: ${e instanceof Error ? e.message : e}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${files.length}`);
process.exit(failed > 0 ? 1 : 0);
