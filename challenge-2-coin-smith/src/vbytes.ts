/**
 * Transaction weight estimation (BIP-141).
 *
 * Bitcoin fees are based on virtual bytes (vbytes), derived from the
 * segregated witness weight system:
 *
 *   weight = non_witness_bytes × 4 + witness_bytes
 *   vbytes = ⌈weight / 4⌉
 *
 * We precompute per-input and per-output vbytes for standard script
 * types, assuming typical single-signature spending patterns. This
 * allows accurate fee estimation before the PSBT is signed.
 *
 * Weight breakdown per input type:
 *
 *   ┌──────────────┬─────────────┬─────────┬────────┬────────┐
 *   │ Input type   │ Non-witness │ Witness │ Weight │ vbytes │
 *   ├──────────────┼─────────────┼─────────┼────────┼────────┤
 *   │ P2PKH        │         148 │       0 │    592 │  148   │
 *   │ P2SH (2of3)  │         256 │       0 │   1024 │  256   │
 *   │ P2SH-P2WPKH  │          64 │     108 │    364 │   91   │
 *   │ P2WPKH       │          41 │     108 │    272 │   68   │
 *   │ P2WSH        │          41 │     252 │    416 │  104   │
 *   │ P2TR (key)   │          41 │      66 │    230 │   57.5 │
 *   └──────────────┴─────────────┴─────────┴────────┴────────┘
 *
 * Transaction overhead:
 *   Legacy-only:  10   vB  (version + vin/vout counts + locktime)
 *   With SegWit:  10.5 vB  (adds 2 witness bytes for marker + flag)
 */

import type { ScriptType, Utxo, Payment, ChangeTemplate } from "./types";

// ── Per-type vbyte tables ──────────────────────────────────────────

const INPUT_VBYTES: Record<ScriptType, number> = {
  p2pkh: 148,
  p2sh: 256,
  "p2sh-p2wpkh": 91,
  p2wpkh: 68,
  p2wsh: 104,
  p2tr: 57.5,
};

const OUTPUT_VBYTES: Record<ScriptType, number> = {
  p2pkh: 34,
  p2sh: 32,
  "p2sh-p2wpkh": 32,
  p2wpkh: 31,
  p2wsh: 43,
  p2tr: 43,
};

const SEGWIT_INPUT_TYPES: Set<ScriptType> = new Set([
  "p2wpkh",
  "p2sh-p2wpkh",
  "p2wsh",
  "p2tr",
]);

// ── Public API ─────────────────────────────────────────────────────

export function inputVbytes(scriptType: ScriptType): number {
  return INPUT_VBYTES[scriptType];
}

export function outputVbytes(scriptType: ScriptType): number {
  return OUTPUT_VBYTES[scriptType];
}

export function isSegwit(scriptType: ScriptType): boolean {
  return SEGWIT_INPUT_TYPES.has(scriptType);
}

export function hasAnySegwitInput(utxos: Utxo[]): boolean {
  return utxos.some((u) => isSegwit(u.script_type));
}

/**
 * Estimate total transaction vbytes for a given set of inputs,
 * payment outputs, and an optional change output.
 */
export function estimateVbytes(
  inputs: Utxo[],
  payments: Payment[],
  change: ChangeTemplate | null,
): number {
  const overhead = hasAnySegwitInput(inputs) ? 10.5 : 10;

  const inputTotal = inputs.reduce(
    (sum, u) => sum + inputVbytes(u.script_type),
    0,
  );

  let outputTotal = payments.reduce(
    (sum, p) => sum + outputVbytes(p.script_type),
    0,
  );

  if (change) {
    outputTotal += outputVbytes(change.script_type);
  }

  return Math.ceil(overhead + inputTotal + outputTotal);
}
