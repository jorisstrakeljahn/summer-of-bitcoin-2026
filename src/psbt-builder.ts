/**
 * PSBT construction (BIP-174).
 *
 * Builds a Partially Signed Bitcoin Transaction containing:
 *   - A global unsigned transaction with correct nVersion, nLockTime,
 *     inputs (txid, vout, nSequence), and outputs (scriptPubKey, value).
 *   - Per-input witness_utxo fields providing the spent output's
 *     scriptPubKey and value for fee verification by signers.
 *
 * We provide witness_utxo for all input types (including legacy P2PKH).
 * BIP-174 allows this ("witness_utxo MAY be provided for non-witness
 * inputs") and it is sufficient for fee verification. We cannot provide
 * non_witness_utxo because the fixture format only supplies the previous
 * output, not the full previous transaction.
 */

import * as bitcoin from "bitcoinjs-lib";
import type { Utxo, OutputEntry, ChangeTemplate, Payment } from "./types";
import { TX_VERSION } from "./constants";

export function buildPsbt(params: {
  network: string;
  selectedInputs: Utxo[];
  payments: Payment[];
  change: ChangeTemplate | null;
  changeAmount: number | null;
  nSequence: number;
  nLockTime: number;
}): { psbtBase64: string; outputs: OutputEntry[] } {
  const btcNetwork =
    params.network === "testnet"
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;

  const psbt = new bitcoin.Psbt({ network: btcNetwork });
  psbt.setVersion(TX_VERSION);
  psbt.setLocktime(params.nLockTime);

  for (const utxo of params.selectedInputs) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      sequence: params.nSequence,
      witnessUtxo: {
        script: Buffer.from(utxo.script_pubkey_hex, "hex"),
        value: BigInt(utxo.value_sats),
      },
    });
  }

  const outputs: OutputEntry[] = [];
  let outputIndex = 0;

  for (const payment of params.payments) {
    psbt.addOutput({
      script: Buffer.from(payment.script_pubkey_hex, "hex"),
      value: BigInt(payment.value_sats),
    });

    outputs.push({
      n: outputIndex++,
      value_sats: payment.value_sats,
      script_pubkey_hex: payment.script_pubkey_hex,
      script_type: payment.script_type,
      address: payment.address,
      is_change: false,
    });
  }

  if (params.change && params.changeAmount !== null) {
    psbt.addOutput({
      script: Buffer.from(params.change.script_pubkey_hex, "hex"),
      value: BigInt(params.changeAmount),
    });

    outputs.push({
      n: outputIndex++,
      value_sats: params.changeAmount,
      script_pubkey_hex: params.change.script_pubkey_hex,
      script_type: params.change.script_type,
      address: params.change.address,
      is_change: true,
    });
  }

  return { psbtBase64: psbt.toBase64(), outputs };
}
