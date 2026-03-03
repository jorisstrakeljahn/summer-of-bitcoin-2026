import * as bitcoin from "bitcoinjs-lib";
import type { Utxo, OutputEntry, ChangeTemplate, Payment } from "./types.js";

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
    params.network === "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

  const psbt = new bitcoin.Psbt({ network: btcNetwork });
  psbt.setVersion(2);
  psbt.setLocktime(params.nLockTime);

  for (const utxo of params.selectedInputs) {
    const scriptBuf = Buffer.from(utxo.script_pubkey_hex, "hex");

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      sequence: params.nSequence,
      witnessUtxo: {
        script: scriptBuf,
        value: BigInt(utxo.value_sats),
      },
    });
  }

  const outputs: OutputEntry[] = [];
  let outputIndex = 0;

  for (const payment of params.payments) {
    const scriptBuf = Buffer.from(payment.script_pubkey_hex, "hex");
    psbt.addOutput({
      script: scriptBuf,
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
    const changeScriptBuf = Buffer.from(params.change.script_pubkey_hex, "hex");
    psbt.addOutput({
      script: changeScriptBuf,
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

  const psbtBase64 = psbt.toBase64();
  return { psbtBase64, outputs };
}
