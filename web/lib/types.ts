/**
 * Shared frontend types.
 *
 * Types used across multiple components and API routes are defined
 * here to avoid duplication and keep interfaces in sync.
 */

// ── Decoded PSBT types ─────────────────────────────────────────────
// Used by both the /api/psbt-decode route and the PsbtViewer component.

export interface DecodedInput {
  index: number;
  txid: string;
  vout: number;
  sequence: string;
  witnessUtxo: { value: number; script: string } | null;
}

export interface DecodedOutput {
  index: number;
  value: number;
  script: string;
}

export interface DecodedPsbt {
  version: number;
  locktime: number;
  inputCount: number;
  outputCount: number;
  inputs: DecodedInput[];
  outputs: DecodedOutput[];
}

// ── Strategy comparison ────────────────────────────────────────────

export interface StrategySummary {
  name: string;
  fee: number;
  vbytes: number;
  inputCount: number;
  hasChange: boolean;
}
