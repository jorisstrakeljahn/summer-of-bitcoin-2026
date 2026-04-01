"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";

export interface FlowTxData {
  txid: string;
  segwit: boolean;
  rbf: boolean;
  version: number;
}

export function FlowTxNode({ data }: NodeProps) {
  const d = data as unknown as FlowTxData;
  return (
    <div
      title={`Transaction ${d.txid.slice(0, 16)}… · ${d.segwit ? "SegWit" : "Legacy"} v${d.version}${d.rbf ? " · RBF" : ""}`}
      className="group cursor-pointer rounded-xl border-2 border-primary/40 bg-card px-5 py-4 text-card-foreground shadow-lg transition-all hover:border-primary hover:shadow-xl"
    >
      <Handle type="target" position={Position.Left} className="bg-primary! w-2! h-2!" />
      <p className="text-[10px] text-muted-foreground mb-1">Transaction</p>
      <p className="font-mono text-xs mb-2">{d.txid.slice(0, 8)}…{d.txid.slice(-8)}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-300">
          {d.segwit ? "SegWit" : "Legacy"}
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-300">
          v{d.version}
        </Badge>
        {d.rbf && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-300">
            RBF
          </Badge>
        )}
      </div>
      <p className="text-[9px] text-muted-foreground/60 mt-1.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        click for details
      </p>
      <Handle type="source" position={Position.Right} className="bg-primary! w-2! h-2!" />
    </div>
  );
}
