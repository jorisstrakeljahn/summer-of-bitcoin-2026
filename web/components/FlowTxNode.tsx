"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface FlowTxData {
  txid: string;
}

export function FlowTxNode({ data }: NodeProps) {
  const d = data as unknown as FlowTxData;
  return (
    <div className="rounded-lg border-2 border-primary/40 bg-card px-5 py-4 text-card-foreground shadow-md">
      <Handle type="target" position={Position.Left} className="bg-primary! w-2! h-2!" />
      <p className="text-[10px] text-muted-foreground mb-0.5">Transaction</p>
      <p className="font-mono text-xs">{d.txid.slice(0, 8)}…{d.txid.slice(-8)}</p>
      <Handle type="source" position={Position.Right} className="bg-primary! w-2! h-2!" />
    </div>
  );
}
