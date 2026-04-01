/**
 * POST /api/psbt-decode — Decode a PSBT from base64.
 *
 * Parses the base64-encoded PSBT using bitcoinjs-lib, extracts the
 * unsigned transaction fields (version, locktime, inputs, outputs),
 * and returns them as structured JSON for the frontend viewer.
 */

import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";
import type { DecodedPsbt, DecodedInput, DecodedOutput } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: { psbt_base64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  if (!body.psbt_base64 || typeof body.psbt_base64 !== "string") {
    return NextResponse.json(
      { error: "Missing psbt_base64 field" },
      { status: 400 },
    );
  }

  try {
    const psbt = bitcoin.Psbt.fromBase64(body.psbt_base64);
    const tx = psbt.data.globalMap.unsignedTx as unknown as {
      tx: bitcoin.Transaction;
    };
    const rawTx = tx.tx;

    const inputs: DecodedInput[] = rawTx.ins.map((inp, i) => {
      const txid = Buffer.from(inp.hash).reverse().toString("hex");
      const witnessUtxoData = psbt.data.inputs[i]?.witnessUtxo;

      return {
        index: i,
        txid,
        vout: inp.index,
        sequence: "0x" + inp.sequence.toString(16).toUpperCase().padStart(8, "0"),
        witnessUtxo: witnessUtxoData
          ? {
              value: Number(witnessUtxoData.value),
              script: Buffer.from(witnessUtxoData.script).toString("hex"),
            }
          : null,
      };
    });

    const outputs: DecodedOutput[] = rawTx.outs.map((out, i) => ({
      index: i,
      value: Number(out.value),
      script: Buffer.from(out.script).toString("hex"),
    }));

    const decoded: DecodedPsbt = {
      version: rawTx.version,
      locktime: rawTx.locktime,
      inputCount: rawTx.ins.length,
      outputCount: rawTx.outs.length,
      inputs,
      outputs,
    };

    return NextResponse.json(decoded);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Failed to decode PSBT: ${message}` },
      { status: 400 },
    );
  }
}
