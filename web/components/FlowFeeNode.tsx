"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface FlowFeeData {
  sats: number;
  rate: number;
}

export function FlowFeeNode({ data }: NodeProps) {
  const d = data as unknown as FlowFeeData;
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-card-foreground shadow-sm">
      <Handle type="target" position={Position.Left} className="bg-primary! w-2! h-2!" />
      <p className="text-[10px] text-primary mb-0.5">Miner Fee</p>
      <p className="text-sm font-medium tabular-nums">{d.sats.toLocaleString()} sat</p>
      <p className="text-[10px] text-muted-foreground">{d.rate} sat/vB</p>
    </div>
  );
}
