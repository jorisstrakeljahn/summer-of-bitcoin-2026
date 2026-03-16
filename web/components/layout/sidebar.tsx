/**
 * Sidebar listing blocks for selection; supports "All Blocks Overview" and per-block view.
 */
"use client";

import { cn } from "@/lib/utils";
import type { BlockSummary } from "@/lib/types";

interface SidebarProps {
  blocks: BlockSummary[];
  activeBlockIdx: number | null;
  onBlockSelect: (idx: number | null) => void;
  loading?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  blocks,
  activeBlockIdx,
  onBlockSelect,
  loading,
  open,
  onClose,
}: SidebarProps) {
  const handleSelect = (idx: number | null) => {
    onBlockSelect(idx);
    onClose?.();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b px-3 py-2">
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full rounded-md px-2 py-2.5 text-left text-sm font-medium transition-colors",
                activeBlockIdx === null
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              All Blocks Overview
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-1 h-12 animate-pulse rounded-md bg-muted"
                />
              ))}

            {!loading &&
              blocks.map((block) => (
                <button
                  key={block.index}
                  onClick={() => handleSelect(block.index)}
                  className={cn(
                    "mb-1 w-full rounded-md px-2 py-2.5 text-left transition-all",
                    activeBlockIdx === block.index
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-accent",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium">
                      #{block.block_height.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {block.tx_count.toLocaleString()} tx
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{block.flagged.toLocaleString()} flagged</span>
                    <span>{block.fee_rate_stats.median_sat_vb} sat/vB</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </aside>
    </>
  );
}
