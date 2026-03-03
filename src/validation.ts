import type { Fixture, ScriptType } from "./types.js";

const VALID_SCRIPT_TYPES: ScriptType[] = [
  "p2pkh",
  "p2sh",
  "p2sh-p2wpkh",
  "p2wpkh",
  "p2wsh",
  "p2tr",
];

class ValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

function assertString(val: unknown, field: string): asserts val is string {
  if (typeof val !== "string" || val.length === 0) {
    throw new ValidationError(
      "INVALID_FIXTURE",
      `${field} must be a non-empty string`,
    );
  }
}

function assertNumber(val: unknown, field: string): asserts val is number {
  if (typeof val !== "number" || !Number.isFinite(val)) {
    throw new ValidationError(
      "INVALID_FIXTURE",
      `${field} must be a finite number`,
    );
  }
}

function assertPositiveNumber(val: unknown, field: string): asserts val is number {
  assertNumber(val, field);
  if (val <= 0) {
    throw new ValidationError(
      "INVALID_FIXTURE",
      `${field} must be positive (got ${val})`,
    );
  }
}

function assertNonNegativeInteger(val: unknown, field: string): asserts val is number {
  assertNumber(val, field);
  if (!Number.isInteger(val) || val < 0) {
    throw new ValidationError(
      "INVALID_FIXTURE",
      `${field} must be a non-negative integer (got ${val})`,
    );
  }
}

function assertHex(val: unknown, field: string): asserts val is string {
  assertString(val, field);
  if (!/^[0-9a-fA-F]+$/.test(val) || val.length % 2 !== 0) {
    throw new ValidationError(
      "INVALID_FIXTURE",
      `${field} must be valid hex (got "${val.slice(0, 20)}...")`,
    );
  }
}

function assertScriptType(val: unknown, field: string): asserts val is ScriptType {
  assertString(val, field);
  if (!VALID_SCRIPT_TYPES.includes(val as ScriptType)) {
    throw new ValidationError(
      "INVALID_FIXTURE",
      `${field} must be one of ${VALID_SCRIPT_TYPES.join(", ")} (got "${val}")`,
    );
  }
}

function assertArray(val: unknown, field: string): asserts val is unknown[] {
  if (!Array.isArray(val)) {
    throw new ValidationError("INVALID_FIXTURE", `${field} must be an array`);
  }
}

function assertObject(val: unknown, field: string): asserts val is Record<string, unknown> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    throw new ValidationError("INVALID_FIXTURE", `${field} must be an object`);
  }
}

export function parseFixture(raw: unknown): Fixture {
  assertObject(raw, "fixture");

  assertString(raw.network, "network");

  assertArray(raw.utxos, "utxos");
  if (raw.utxos.length === 0) {
    throw new ValidationError("INVALID_FIXTURE", "utxos must not be empty");
  }

  const utxos = raw.utxos.map((u: unknown, i: number) => {
    assertObject(u, `utxos[${i}]`);
    assertHex(u.txid, `utxos[${i}].txid`);
    if ((u.txid as string).length !== 64) {
      throw new ValidationError(
        "INVALID_FIXTURE",
        `utxos[${i}].txid must be 64 hex characters`,
      );
    }
    assertNonNegativeInteger(u.vout, `utxos[${i}].vout`);
    assertPositiveNumber(u.value_sats, `utxos[${i}].value_sats`);
    assertHex(u.script_pubkey_hex, `utxos[${i}].script_pubkey_hex`);
    assertScriptType(u.script_type, `utxos[${i}].script_type`);
    assertString(u.address, `utxos[${i}].address`);

    return {
      txid: u.txid as string,
      vout: u.vout as number,
      value_sats: u.value_sats as number,
      script_pubkey_hex: u.script_pubkey_hex as string,
      script_type: u.script_type as ScriptType,
      address: u.address as string,
    };
  });

  assertArray(raw.payments, "payments");
  if (raw.payments.length === 0) {
    throw new ValidationError("INVALID_FIXTURE", "payments must not be empty");
  }

  const payments = raw.payments.map((p: unknown, i: number) => {
    assertObject(p, `payments[${i}]`);
    assertString(p.address, `payments[${i}].address`);
    assertHex(p.script_pubkey_hex, `payments[${i}].script_pubkey_hex`);
    assertScriptType(p.script_type, `payments[${i}].script_type`);
    assertPositiveNumber(p.value_sats, `payments[${i}].value_sats`);

    return {
      address: p.address as string,
      script_pubkey_hex: p.script_pubkey_hex as string,
      script_type: p.script_type as ScriptType,
      value_sats: p.value_sats as number,
    };
  });

  assertObject(raw.change, "change");
  assertString(raw.change.address, "change.address");
  assertHex(raw.change.script_pubkey_hex, "change.script_pubkey_hex");
  assertScriptType(raw.change.script_type, "change.script_type");

  const change = {
    address: raw.change.address as string,
    script_pubkey_hex: raw.change.script_pubkey_hex as string,
    script_type: raw.change.script_type as ScriptType,
  };

  assertPositiveNumber(raw.fee_rate_sat_vb, "fee_rate_sat_vb");

  const fixture: Fixture = {
    network: raw.network as string,
    utxos,
    payments,
    change,
    fee_rate_sat_vb: raw.fee_rate_sat_vb as number,
  };

  if (raw.rbf !== undefined) {
    if (typeof raw.rbf !== "boolean") {
      throw new ValidationError("INVALID_FIXTURE", "rbf must be a boolean");
    }
    fixture.rbf = raw.rbf;
  }

  if (raw.locktime !== undefined) {
    assertNonNegativeInteger(raw.locktime, "locktime");
    fixture.locktime = raw.locktime as number;
  }

  if (raw.current_height !== undefined) {
    assertNonNegativeInteger(raw.current_height, "current_height");
    fixture.current_height = raw.current_height as number;
  }

  if (raw.policy !== undefined) {
    assertObject(raw.policy, "policy");
    if (raw.policy.max_inputs !== undefined) {
      assertPositiveNumber(raw.policy.max_inputs, "policy.max_inputs");
      fixture.policy = { max_inputs: raw.policy.max_inputs as number };
    }
  }

  return fixture;
}

export { ValidationError };
