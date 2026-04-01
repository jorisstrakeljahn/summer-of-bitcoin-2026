/**
 * Tests for defensive fixture validation.
 *
 * The validation layer is the first line of defense against malformed
 * inputs. Hidden test fixtures may include intentionally broken data
 * (missing fields, wrong types, invalid hex, etc.) that must produce
 * structured errors instead of crashes.
 *
 * Coverage:
 *   - Valid fixture parsing (happy path)
 *   - Root-level type rejection (non-objects)
 *   - Missing / empty required fields
 *   - Type and format errors (hex, integers, script types)
 *   - Optional field parsing (rbf, locktime, policy)
 *   - Forward compatibility (unknown fields are ignored)
 */

import { describe, it, expect } from "vitest";
import { parseFixture, ValidationError } from "../src/validation.js";

function validRawFixture(): Record<string, unknown> {
  return {
    network: "mainnet",
    utxos: [
      {
        txid: "aa".repeat(32),
        vout: 0,
        value_sats: 100_000,
        script_pubkey_hex: "0014" + "cc".repeat(20),
        script_type: "p2wpkh",
        address: "bc1qtest",
      },
    ],
    payments: [
      {
        address: "bc1qpay",
        script_pubkey_hex: "0014" + "dd".repeat(20),
        script_type: "p2wpkh",
        value_sats: 50_000,
      },
    ],
    change: {
      address: "bc1qchange",
      script_pubkey_hex: "0014" + "ee".repeat(20),
      script_type: "p2wpkh",
    },
    fee_rate_sat_vb: 5,
  };
}

describe("parseFixture", () => {
  // ── Happy path ───────────────────────────────────────────────────

  it("parses a valid fixture and extracts all required fields", () => {
    const fixture = parseFixture(validRawFixture());

    expect(fixture.network).toBe("mainnet");
    expect(fixture.utxos).toHaveLength(1);
    expect(fixture.payments).toHaveLength(1);
    expect(fixture.fee_rate_sat_vb).toBe(5);
  });

  it("parses optional fields (rbf, locktime, current_height, policy)", () => {
    const raw = validRawFixture();
    raw.rbf = true;
    raw.locktime = 850_000;
    raw.current_height = 860_000;
    raw.policy = { max_inputs: 3 };

    const fixture = parseFixture(raw);

    expect(fixture.rbf).toBe(true);
    expect(fixture.locktime).toBe(850_000);
    expect(fixture.current_height).toBe(860_000);
    expect(fixture.policy?.max_inputs).toBe(3);
  });

  it("ignores unknown fields for forward compatibility", () => {
    const raw = validRawFixture();
    (raw as Record<string, unknown>).unknown_field = "should be ignored";
    (raw as Record<string, unknown>).internal_metadata = { foo: "bar" };

    expect(() => parseFixture(raw)).not.toThrow();
  });

  // ── Root-level type rejection ────────────────────────────────────

  it("rejects non-object inputs (string, null, number)", () => {
    expect(() => parseFixture("not an object")).toThrow(ValidationError);
    expect(() => parseFixture(null)).toThrow(ValidationError);
    expect(() => parseFixture(42)).toThrow(ValidationError);
  });

  // ── Missing / empty required fields ──────────────────────────────

  it("rejects missing utxos field", () => {
    const raw = validRawFixture();
    delete raw.utxos;

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects empty utxos array (need at least one coin to spend)", () => {
    const raw = validRawFixture();
    raw.utxos = [];

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects empty payments array (need at least one recipient)", () => {
    const raw = validRawFixture();
    raw.payments = [];

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  // ── Type and format errors ───────────────────────────────────────

  it("rejects invalid hex characters in script_pubkey_hex", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].script_pubkey_hex = "ZZZZ";

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects odd-length hex strings (must be byte-aligned)", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].script_pubkey_hex = "abc";

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects unknown script types", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].script_type = "p2banana";

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects non-integer value_sats (must be whole satoshis)", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].value_sats = 1.5;

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects txid with wrong length (must be exactly 64 hex chars)", () => {
    const raw = validRawFixture();
    (raw.utxos as Record<string, unknown>[])[0].txid = "aabb";

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  // ── Fee rate validation ──────────────────────────────────────────

  it("rejects negative fee rate", () => {
    const raw = validRawFixture();
    raw.fee_rate_sat_vb = -1;

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });

  it("rejects zero fee rate (must be positive)", () => {
    const raw = validRawFixture();
    raw.fee_rate_sat_vb = 0;

    expect(() => parseFixture(raw)).toThrow(ValidationError);
  });
});
