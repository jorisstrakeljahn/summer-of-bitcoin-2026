"use client";

import type { BlockSummary } from "@/lib/chain-lens/types";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight } from "lucide-react";

interface BlockSummaryListProps {
  blocks: BlockSummary[];
  onSelectBlock: (hash: string) => void;
  disabled?: boolean;
}

export function BlockSummaryList({ blocks, onSelectBlock, disabled }: BlockSummaryListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {blocks.length} Block{blocks.length !== 1 ? "s" : ""} analyzed
        </h2>
        <p className="text-sm text-muted-foreground">Click a block to see full details</p>
      </div>

      <div className="space-y-3">
        {blocks.map((b, i) => {
          const ts = new Date(b.block_header.timestamp * 1000);

          return (
            <Card
              key={b.block_hash}
              className={`transition-all ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50 hover:shadow-md"}`}
              onClick={() => !disabled && onSelectBlock(b.block_hash)}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                        Block #{i}
                      </Badge>
                      {b.coinbase?.bip34_height != null && (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          Height {b.coinbase.bip34_height.toLocaleString()}
                        </Badge>
                      )}
                      {!b.block_header.merkle_root_valid && (
                        <Badge className="bg-red-900/40 text-red-300 text-[10px]">
                          <X className="h-3 w-3 mr-0.5" />Merkle Invalid
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {b.block_hash.slice(0, 16)}…{b.block_hash.slice(-8)}
                      </span>
                      <CopyButton text={b.block_hash} />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-foreground/70">
                      <span className="tabular-nums">{b.tx_count.toLocaleString()} txs</span>
                      <span className="tabular-nums">{b.block_stats.total_fees_sats.toLocaleString()} sat fees</span>
                      <span className="tabular-nums">{b.block_stats.avg_fee_rate_sat_vb} sat/vB avg</span>
                      <span className="text-foreground/50">
                        {ts.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.entries(b.block_stats.script_type_summary)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)
                        .map(([type, count]) => (
                          <Badge key={type} variant="secondary" className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0">
                            {type.toUpperCase()} {count}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
