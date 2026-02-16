/**
 * Prevout matching tests.
 * Verifies correct matching, fee computation, and error cases.
 */

import { readFileSync } from "fs";
import { parseTransaction } from "../src/lib/tx-parser.js";
import { matchPrevouts } from "../src/lib/prevout.js";
import { test, assertEqual, assertThrows } from "./helpers.js";
import type { Fixture, FixturePrevout } from "../src/lib/types.js";

function loadFixture(name: string): Fixture {
  return JSON.parse(readFileSync(`fixtures/transactions/${name}.json`, "utf-8"));
}

// --- All fixtures match ---

const names = [
  "tx_legacy_p2pkh",
  "tx_legacy_p2sh_p2wsh",
  "tx_multi_input_legacy",
  "multi_input_segwit",
  "tx_segwit_p2wpkh_p2tr",
  "segwit_nested_scriptsig_empty_witness_item",
  "prevouts_unordered",
];

for (const name of names) {
  test(`${name} prevouts match`, () => {
    const f = loadFixture(name);
    const p = parseTransaction(f.raw_tx);
    const m = matchPrevouts(p.inputs, f.prevouts);
    assertEqual(m.length, p.inputs.length);
  });
}

// --- Fee computation ---

const fees: Record<string, number> = {
  tx_legacy_p2pkh: 800,
  tx_legacy_p2sh_p2wsh: 10000,
  tx_multi_input_legacy: 2000,
  multi_input_segwit: 2000,
  tx_segwit_p2wpkh_p2tr: 5000,
  segwit_nested_scriptsig_empty_witness_item: 1000,
  prevouts_unordered: 7000,
};

for (const [name, expected] of Object.entries(fees)) {
  test(`${name} fee = ${expected}`, () => {
    const f = loadFixture(name);
    const p = parseTransaction(f.raw_tx);
    const m = matchPrevouts(p.inputs, f.prevouts);
    const totalIn = m.reduce((s, v) => s + v.value_sats, 0);
    const totalOut = p.outputs.reduce((s, v) => s + Number(v.value), 0);
    assertEqual(totalIn - totalOut, expected);
  });
}

// --- Error cases ---

const dummyInput = { txid: "aa".repeat(32), vout: 0, scriptSig: Buffer.alloc(0), sequence: 0xffffffff };
const dummyPrevout: FixturePrevout = { txid: "aa".repeat(32), vout: 0, value_sats: 1000, script_pubkey_hex: "0014" + "bb".repeat(20) };

test("throws on missing prevout", () => {
  assertThrows(() => matchPrevouts([dummyInput], []), "Missing prevout");
});

test("throws on duplicate prevout", () => {
  assertThrows(() => matchPrevouts([], [dummyPrevout, dummyPrevout]), "Duplicate prevout");
});

test("throws on unused prevout", () => {
  const extra: FixturePrevout = { txid: "cc".repeat(32), vout: 1, value_sats: 2000, script_pubkey_hex: "0014" + "dd".repeat(20) };
  assertThrows(() => matchPrevouts([dummyInput], [dummyPrevout, extra]), "Unused prevouts");
});

test("throws on wrong vout", () => {
  const wrong: FixturePrevout = { ...dummyPrevout, vout: 1 };
  assertThrows(() => matchPrevouts([dummyInput], [wrong]), "Missing prevout");
});
