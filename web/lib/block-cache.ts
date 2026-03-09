import { readFileSync } from "fs";
import { join } from "path";
import { iterateBlocks } from "@sherlock/lib/block-parser";
import { computeTxid } from "@sherlock/lib/tx-serializer";
import { classifyOutputScript, classifyInputScript } from "@sherlock/lib/script";
import { deriveAddress } from "@sherlock/lib/address";
import type { ParsedBlock } from "@sherlock/lib/block-parser";
import type { BlockUndo, UndoPrevout } from "@sherlock/lib/undo-parser";
import type { ParsedTransaction } from "@sherlock/lib/types";

interface TxLocation {
  blockIdx: number;
  txIdx: number;
}

interface CachedBlockData {
  blocks: ParsedBlock[];
  undos: BlockUndo[];
  txIndex: Map<string, TxLocation>;
}

const cache = new Map<string, CachedBlockData>();

function fixturesDir(): string {
  return join(process.cwd(), "..", "fixtures");
}

function loadBlockData(stem: string): CachedBlockData {
  if (cache.has(stem)) return cache.get(stem)!;

  const suffix = stem.replace("blk", "");
  const blkPath = join(fixturesDir(), `blk${suffix}.dat`);
  const revPath = join(fixturesDir(), `rev${suffix}.dat`);
  const xorPath = join(fixturesDir(), "xor.dat");

  const blkData = readFileSync(blkPath);
  const revData = readFileSync(revPath);
  const xorKey = readFileSync(xorPath);

  const blocks: ParsedBlock[] = [];
  const undos: BlockUndo[] = [];
  const txIndex = new Map<string, TxLocation>();

  for (const { block, undo } of iterateBlocks(blkData, revData, xorKey)) {
    const blockIdx = blocks.length;
    blocks.push(block);
    undos.push(undo);

    for (let txIdx = 0; txIdx < block.transactions.length; txIdx++) {
      const txid = computeTxid(block.transactions[txIdx]);
      txIndex.set(txid, { blockIdx, txIdx });
    }
  }

  const data: CachedBlockData = { blocks, undos, txIndex };
  cache.set(stem, data);
  return data;
}

export interface TxDetailVin {
  txid: string;
  vout: number;
  sequence: number;
  script_sig_hex: string;
  script_type: string;
  address: string | null;
  value_sats: number;
  has_timelock: boolean;
}

export interface TxDetailVout {
  n: number;
  value_sats: number;
  script_pubkey_hex: string;
  script_type: string;
  address: string | null;
  is_dust: boolean;
  is_op_return: boolean;
}

export interface TxDetailResponse {
  txid: string;
  version: number;
  segwit: boolean;
  locktime: number;
  size_bytes: number;
  weight: number;
  vbytes: number;
  fee_sats: number;
  fee_rate_sat_vb: number;
  total_input_sats: number;
  total_output_sats: number;
  vin: TxDetailVin[];
  vout: TxDetailVout[];
}

function hasRelativeTimelock(sequence: number): boolean {
  return (sequence & 0x80000000) === 0 && sequence !== 0xffffffff;
}

function buildTxDetail(
  tx: ParsedTransaction,
  txid: string,
  prevouts: UndoPrevout[],
  isCoinbase: boolean,
): TxDetailResponse {
  const vin: TxDetailVin[] = tx.inputs.map((inp, i) => {
    if (isCoinbase) {
      return {
        txid: inp.txid,
        vout: inp.vout,
        sequence: inp.sequence,
        script_sig_hex: inp.scriptSig.toString("hex"),
        script_type: "coinbase",
        address: null,
        value_sats: 0,
        has_timelock: false,
      };
    }

    const prevout = prevouts[i];
    const prevScriptHex = prevout.script_pubkey_hex;
    const outputScriptType = classifyOutputScript(prevScriptHex);
    const witnessHex = tx.witness[i]?.map((w) => w.toString("hex")) ?? [];
    const inputScriptType = classifyInputScript(
      prevScriptHex,
      inp.scriptSig.toString("hex"),
      witnessHex,
    );
    const address = deriveAddress(prevScriptHex, outputScriptType, "mainnet");

    return {
      txid: inp.txid,
      vout: inp.vout,
      sequence: inp.sequence,
      script_sig_hex: inp.scriptSig.toString("hex"),
      script_type: inputScriptType,
      address,
      value_sats: prevout.value_sats,
      has_timelock: hasRelativeTimelock(inp.sequence),
    };
  });

  const vout: TxDetailVout[] = tx.outputs.map((out, i) => {
    const scriptHex = out.scriptPubKey.toString("hex");
    const scriptType = classifyOutputScript(scriptHex);
    const address = deriveAddress(scriptHex, scriptType, "mainnet");
    const valueSats = Number(out.value);

    return {
      n: i,
      value_sats: valueSats,
      script_pubkey_hex: scriptHex,
      script_type: scriptType,
      address,
      is_dust: valueSats < 546 && scriptType !== "op_return",
      is_op_return: scriptType === "op_return",
    };
  });

  const totalIn = vin.reduce((s, v) => s + v.value_sats, 0);
  const totalOut = vout.reduce((s, v) => s + v.value_sats, 0);
  const fee = isCoinbase ? 0 : totalIn - totalOut;
  const weight = tx.nonWitnessBytes * 4 + tx.witnessBytes;
  const vbytes = Math.ceil(weight / 4);

  return {
    txid,
    version: tx.version,
    segwit: tx.segwit,
    locktime: tx.locktime,
    size_bytes: tx.nonWitnessBytes + tx.witnessBytes,
    weight,
    vbytes,
    fee_sats: fee,
    fee_rate_sat_vb: vbytes > 0 ? Math.round((fee / vbytes) * 100) / 100 : 0,
    total_input_sats: totalIn,
    total_output_sats: totalOut,
    vin,
    vout,
  };
}

export function getTxDetail(
  stem: string,
  txid: string,
): TxDetailResponse | null {
  const data = loadBlockData(stem);
  const loc = data.txIndex.get(txid);
  if (!loc) return null;

  const block = data.blocks[loc.blockIdx];
  const undo = data.undos[loc.blockIdx];
  const tx = block.transactions[loc.txIdx];
  const isCoinbase = loc.txIdx === 0;
  const prevouts = isCoinbase ? [] : undo[loc.txIdx - 1] ?? [];

  return buildTxDetail(tx, txid, prevouts, isCoinbase);
}
