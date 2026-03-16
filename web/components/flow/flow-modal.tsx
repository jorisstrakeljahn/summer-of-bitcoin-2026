/**
 * Full-screen modal that fetches and displays a transaction flow graph.
 */
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { TransactionFlow } from "./transaction-flow";
import { InfoButton } from "@/components/info-panel";
import { INFO } from "@/lib/info-content";
import type { TxDetailResponse } from "@/lib/block-cache-types";
import { truncateTxid } from "@/lib/utils";

interface Props {
  stem: string;
  txid: string;
  onClose: () => void;
}

export function FlowModal({ stem, txid, onClose }: Props) {
  const [txDetail, setTxDetail] = useState<TxDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/tx/${stem}/${txid}`)
      .then((r) => {
        if (!r.ok) throw new Error("Transaction not found");
        return r.json();
      })
      .then(setTxDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stem, txid]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-0 flex h-[100dvh] w-full flex-col border bg-background shadow-2xl sm:mx-4 sm:h-[80vh] sm:max-w-5xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-sm font-semibold">Transaction Graph</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {truncateTxid(txid, 16)}
              </p>
            </div>
            <InfoButton title={INFO.transactionGraph.title}>
              {INFO.transactionGraph.body}
            </InfoButton>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2.5 hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Parsing transaction from raw block data...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {txDetail && !loading && (
            <TransactionFlow txDetail={txDetail} />
          )}
        </div>

        {txDetail && (
          <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground sm:gap-4 sm:px-5">
            <span>
              {txDetail.vin.length} input{txDetail.vin.length !== 1 ? "s" : ""}
            </span>
            <span>
              {txDetail.vout.length} output{txDetail.vout.length !== 1 ? "s" : ""}
            </span>
            <span>{txDetail.fee_sats.toLocaleString()} sat fee</span>
            <span>{txDetail.fee_rate_sat_vb} sat/vB</span>
            <span>{txDetail.vbytes.toLocaleString()} vB</span>
            {txDetail.segwit && <span className="text-primary">SegWit</span>}
          </div>
        )}
      </div>
    </div>
  );
}
