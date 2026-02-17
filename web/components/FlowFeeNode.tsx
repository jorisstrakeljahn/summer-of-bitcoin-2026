"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle } from "lucide-react";

export interface FlowFeeData {
  sats: number;
  rate: number;
  highFee: boolean;
}

export function FlowFeeNode({ data }: NodeProps) {
  const d = data as unknown as FlowFeeData;
  return (
    <div
      title={`Miner fee: ${d.sats.toLocaleString()} sat (${d.rate} sat/vB)${d.highFee ? " ⚠ High fee" : ""}`}
      className="group cursor-pointer rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-card-foreground shadow-sm transition-all hover:border-primary hover:shadow-md"
    >
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-[10px] text-primary">Miner Fee</p>
        {d.highFee && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
      </div>
      <p className="text-sm font-medium tabular-nums">{d.sats.toLocaleString()} sat</p>
      <p className="text-[10px] text-muted-foreground">{d.rate} sat/vB</p>
      <p className="text-[9px] text-muted-foreground/60 mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        click for details
      </p>
    </div>
  );
}
