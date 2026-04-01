/**
 * OP_RETURN Analysis Heuristic.
 *
 * Detects OP_RETURN outputs and classifies the embedded data by protocol.
 * Known protocols: Omni Layer, OpenTimestamps.
 * Tracks the number and type of OP_RETURN outputs per transaction.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import { parseOpReturnPayload } from "../lib/script.js";

export interface OpReturnResult extends HeuristicResult {
  detected: boolean;
  protocols?: string[];
  count?: number;
}

function analyze(ctx: TransactionContext): OpReturnResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const protocols: string[] = [];

  for (let i = 0; i < ctx.tx.outputs.length; i++) {
    if (ctx.outputScriptTypes[i] !== "op_return") continue;

    const scriptHex = ctx.tx.outputs[i].scriptPubKey.toString("hex");
    const payload = parseOpReturnPayload(scriptHex);
    protocols.push(payload.op_return_protocol);
  }

  if (protocols.length === 0) {
    return { detected: false };
  }

  return {
    detected: true,
    protocols,
    count: protocols.length,
  };
}

export const opReturn: Heuristic = { id: "op_return", analyze };
