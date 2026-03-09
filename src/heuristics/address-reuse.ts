/**
 * Address Reuse Heuristic.
 *
 * Detects when the same address appears in both inputs and outputs of a
 * transaction. Address reuse weakens privacy and links transaction outputs
 * to the same entity. This is a strong signal that an output belongs to
 * the spender rather than a payment recipient.
 */

import type { Heuristic, HeuristicResult, TransactionContext } from "./types.js";
import { classifyOutputScript } from "../lib/script.js";
import { deriveAddress } from "../lib/address.js";

export interface AddressReuseResult extends HeuristicResult {
  detected: boolean;
  reused_addresses?: string[];
}

function analyze(ctx: TransactionContext): AddressReuseResult {
  if (ctx.isCoinbase) {
    return { detected: false };
  }

  const inputAddresses = new Set<string>();
  for (const prevout of ctx.prevouts) {
    const scriptType = classifyOutputScript(prevout.script_pubkey_hex);
    const addr = deriveAddress(prevout.script_pubkey_hex, scriptType, "mainnet");
    if (addr) inputAddresses.add(addr);
  }

  if (inputAddresses.size === 0) {
    return { detected: false };
  }

  const reused: string[] = [];
  for (const output of ctx.tx.outputs) {
    const scriptHex = output.scriptPubKey.toString("hex");
    const scriptType = classifyOutputScript(scriptHex);
    const addr = deriveAddress(scriptHex, scriptType, "mainnet");
    if (addr && inputAddresses.has(addr)) {
      reused.push(addr);
    }
  }

  if (reused.length === 0) {
    return { detected: false };
  }

  return {
    detected: true,
    reused_addresses: [...new Set(reused)],
  };
}

export const addressReuse: Heuristic = { id: "address_reuse", analyze };
