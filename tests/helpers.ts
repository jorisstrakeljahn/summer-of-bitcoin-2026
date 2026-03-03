import type { Utxo, Payment, ChangeTemplate, Fixture, ScriptType } from "../src/types.js";

let counter = 0;

function scriptPubkeyForType(type: ScriptType): string {
  switch (type) {
    case "p2pkh":
      return "76a914" + "aa".repeat(20) + "88ac";
    case "p2sh":
    case "p2sh-p2wpkh":
      return "a914" + "bb".repeat(20) + "87";
    case "p2wpkh":
      return "0014" + "cc".repeat(20);
    case "p2wsh":
      return "0020" + "dd".repeat(32);
    case "p2tr":
      return "5120" + "ee".repeat(32);
  }
}

export function makeUtxo(overrides: Partial<Utxo> = {}): Utxo {
  const scriptType = overrides.script_type ?? "p2wpkh";
  return {
    txid: (++counter).toString(16).padStart(64, "0"),
    vout: 0,
    value_sats: 100_000,
    script_pubkey_hex: scriptPubkeyForType(scriptType),
    script_type: scriptType,
    address: `addr_${counter}`,
    ...overrides,
  };
}

export function makePayment(overrides: Partial<Payment> = {}): Payment {
  const scriptType = overrides.script_type ?? "p2wpkh";
  return {
    address: `pay_${++counter}`,
    script_pubkey_hex: scriptPubkeyForType(scriptType),
    script_type: scriptType,
    value_sats: 50_000,
    ...overrides,
  };
}

export function makeChange(overrides: Partial<ChangeTemplate> = {}): ChangeTemplate {
  const scriptType = overrides.script_type ?? "p2wpkh";
  return {
    address: `change_${++counter}`,
    script_pubkey_hex: scriptPubkeyForType(scriptType),
    script_type: scriptType,
    ...overrides,
  };
}

export function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    network: "mainnet",
    utxos: [makeUtxo({ value_sats: 100_000 })],
    payments: [makePayment({ value_sats: 50_000 })],
    change: makeChange(),
    fee_rate_sat_vb: 5,
    ...overrides,
  };
}
