"use client";

import { ChevronDown, ChevronRight, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { ClassificationBadge } from "@/components/badges/classification-badge";
import { HeuristicBadge } from "@/components/badges/heuristic-badge";
import { truncateTxid } from "@/lib/utils";
import type { TransactionClassification } from "@/lib/types";
import { HEURISTIC_LABELS } from "@/lib/constants";
import type { HeuristicId } from "@/lib/types";

interface Transaction {
  txid: string;
  heuristics: Record<string, { detected: boolean }>;
  classification: string;
}

interface Props {
  tx: Transaction;
  stem: string;
  onViewGraph?: (txid: string) => void;
}

const HEURISTIC_DESCRIPTIONS: Record<string, string> = {
  cioh: "Multiple inputs likely belong to the same entity (Common Input Ownership).",
  change_detection: "Identified a likely change output based on script type or value analysis.",
  address_reuse: "Same address appears in both inputs and outputs, weakening privacy.",
  coinjoin: "Multiple users combine inputs with equal-value outputs to obscure ownership.",
  consolidation: "Many inputs combined into few outputs — typical wallet maintenance.",
  self_transfer: "All outputs match input script patterns — likely same-entity transfer.",
  round_number_payment: "Output value is a round BTC amount, suggesting it is a payment.",
  op_return: "Contains OP_RETURN output with embedded data (e.g., timestamps, protocols).",
  peeling_chain: "Pattern of large input split into small payment and large change.",
};

export function TransactionRow({ tx, stem, onViewGraph }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const heuristicIds = Object.keys(tx.heuristics);

  const handleCopy = () => {
    navigator.clipboard.writeText(tx.txid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}

        <span className="w-36 shrink-0 font-mono text-xs">
          {truncateTxid(tx.txid)}
        </span>

        <span className="w-32 shrink-0">
          <ClassificationBadge
            classification={tx.classification as TransactionClassification}
          />
        </span>

        <div className="flex flex-1 flex-wrap gap-1">
          {heuristicIds.slice(0, 4).map((h) => (
            <HeuristicBadge key={h} id={h} />
          ))}
          {heuristicIds.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{heuristicIds.length - 4}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">TXID:</span>
            <code className="flex-1 break-all font-mono text-xs">
              {tx.txid}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded p-1 hover:bg-accent transition-colors"
              aria-label="Copy TXID"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <a
              href={`https://mempool.space/tx/${tx.txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded p-1 hover:bg-accent transition-colors"
              aria-label="View on mempool.space"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          {heuristicIds.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Detected Heuristics
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {heuristicIds.map((h) => (
                  <div
                    key={h}
                    className="rounded-md border bg-card p-3"
                  >
                    <p className="text-xs font-semibold">
                      {HEURISTIC_LABELS[h as HeuristicId] ?? h}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {HEURISTIC_DESCRIPTIONS[h] ?? "Heuristic detected."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onViewGraph && (
            <button
              onClick={() => onViewGraph(tx.txid)}
              className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Transaction Graph
            </button>
          )}
        </div>
      )}
    </div>
  );
}
