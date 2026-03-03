import type { ScriptType, Utxo, Payment, ChangeTemplate } from "./types";

const INPUT_VBYTES: Record<string, number> = {
  p2pkh: 148,
  p2sh: 256,
  "p2sh-p2wpkh": 91,
  p2wpkh: 68,
  p2wsh: 104,
  p2tr: 57.5,
};

const OUTPUT_VBYTES: Record<string, number> = {
  p2pkh: 34,
  p2sh: 32,
  "p2sh-p2wpkh": 32,
  p2wpkh: 31,
  p2wsh: 43,
  p2tr: 43,
};

const SEGWIT_TYPES: Set<ScriptType> = new Set([
  "p2wpkh",
  "p2sh-p2wpkh",
  "p2wsh",
  "p2tr",
]);

export function inputVbytes(scriptType: ScriptType): number {
  const vb = INPUT_VBYTES[scriptType];
  if (vb === undefined) {
    throw new Error(`Unknown input script type: ${scriptType}`);
  }
  return vb;
}

export function outputVbytes(scriptType: ScriptType): number {
  const vb = OUTPUT_VBYTES[scriptType];
  if (vb === undefined) {
    throw new Error(`Unknown output script type: ${scriptType}`);
  }
  return vb;
}

export function isSegwit(scriptType: ScriptType): boolean {
  return SEGWIT_TYPES.has(scriptType);
}

export function hasAnySegwitInput(utxos: Utxo[]): boolean {
  return utxos.some((u) => isSegwit(u.script_type));
}

export function estimateVbytes(
  inputs: Utxo[],
  payments: Payment[],
  change: ChangeTemplate | null,
): number {
  const hasSegwit = hasAnySegwitInput(inputs);
  const overhead = hasSegwit ? 10.5 : 10;

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
