/**
 * Grid of colored tiles representing transactions by classification; clickable for details.
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from "@/lib/constants";
import { Spinner } from "@/components/spinner";
import { InfoButton } from "@/components/info-panel";
import { INFO } from "@/lib/info-content";
import type { TransactionClassification, MosaicTx } from "@/lib/types";
import { truncateTxid } from "@/lib/utils";

interface Props {
  stem: string;
  blockIdx: number;
  onTxClick?: (txid: string) => void;
}

export function BlockMosaic({ stem, blockIdx, onTxClick }: Props) {
  const [transactions, setTransactions] = useState<MosaicTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTx, setHoveredTx] = useState<MosaicTx | null>(null);
  const [selectedTx, setSelectedTx] = useState<MosaicTx | null>(null);
  const [tileSize, setTileSize] = useState(6);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setTileSize(mq.matches ? 10 : 6);
    const handler = (e: MediaQueryListEvent) => setTileSize(e.matches ? 10 : 6);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/analysis/${stem}/blocks/${blockIdx}/transactions?page=1&size=200`,
    )
      .then((r) => r.json())
      .then((data) => {
        const allTxs: MosaicTx[] = [];
        const fetchAll = async () => {
          allTxs.push(
            ...data.transactions.map((t: MosaicTx) => ({
              txid: t.txid,
              classification: t.classification,
            })),
          );

          for (let p = 2; p <= Math.min(data.total_pages, 30); p++) {
            const res = await fetch(
              `/api/analysis/${stem}/blocks/${blockIdx}/transactions?page=${p}&size=200`,
            );
            const page = await res.json();
            allTxs.push(
              ...page.transactions.map((t: MosaicTx) => ({
                txid: t.txid,
                classification: t.classification,
              })),
            );
          }
          setTransactions(allTxs);
          setLoading(false);
        };
        fetchAll();
      })
      .catch(() => setLoading(false));
  }, [stem, blockIdx]);

  const legend = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) {
      counts[tx.classification] = (counts[tx.classification] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([cls, count]) => ({
        cls: cls as TransactionClassification,
        count,
        color: CLASSIFICATION_COLORS[cls as TransactionClassification] ?? "#6b7280",
        label: CLASSIFICATION_LABELS[cls as TransactionClassification] ?? cls,
      }));
  }, [transactions]);

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-5">
        <h3 className="text-sm font-semibold">Block Mosaic</h3>
        <div className="mt-4 flex items-center justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            Block Mosaic — {transactions.length.toLocaleString()} transactions
          </h3>
          <InfoButton title={INFO.blockMosaic.title}>
            {INFO.blockMosaic.body}
          </InfoButton>
        </div>
        {hoveredTx && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            <span className="font-mono">{truncateTxid(hoveredTx.txid)}</span>
            {" · "}
            {CLASSIFICATION_LABELS[hoveredTx.classification as TransactionClassification] ??
              hoveredTx.classification}
          </span>
        )}
      </div>

      <div
        className="mt-3 grid gap-px"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
        }}
      >
        {transactions.map((tx) => (
          <div
            key={tx.txid}
            className="aspect-square cursor-pointer rounded-[1px] transition-transform hover:scale-150 hover:z-10"
            style={{
              backgroundColor:
                CLASSIFICATION_COLORS[tx.classification as TransactionClassification] ??
                "#6b7280",
            }}
            onMouseEnter={() => setHoveredTx(tx)}
            onMouseLeave={() => setHoveredTx(null)}
            onClick={() => {
              setSelectedTx(tx);
              onTxClick?.(tx.txid);
            }}
            title={`${truncateTxid(tx.txid)} — ${tx.classification}`}
          />
        ))}
      </div>

      {selectedTx && (
        <p className="mt-2 text-xs text-muted-foreground sm:hidden">
          <span className="font-mono">{truncateTxid(selectedTx.txid)}</span>
          {" · "}
          {CLASSIFICATION_LABELS[selectedTx.classification as TransactionClassification] ??
            selectedTx.classification}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {legend.map((l) => (
          <div key={l.cls} className="flex items-center gap-1.5 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: l.color }}
            />
            <span className="text-muted-foreground">
              {l.label} ({l.count.toLocaleString()})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
