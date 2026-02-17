"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle } from "lucide-react";

export interface FlowFeeData {
  sats: number;
  rate: number;
  highFee: boolean;
  proportion: number;
}

export function FlowFeeNode({ data }: NodeProps) {
  const d = data as unknown as FlowFeeData;
  return (
    <div
      title={`Miner fee: ${d.sats.toLocaleString()} sat (${d.rate} sat/vB)${d.highFee ? " — High fee" : ""}`}
      className="group cursor-pointer rounded-lg border bg-card px-4 py-3 text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md min-w-[180px]"
    >
      <Handle type="target" position={Position.Left} className="bg-primary! w-2! h-2!" />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-muted-foreground">Miner Fee</p>
        {d.highFee && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
      </div>
      <p className="font-mono text-xs mb-1.5">{d.rate} sat/vB</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums font-medium">{d.sats.toLocaleString()} sat</span>
      </div>
      <div className="mt-1.5 h-1 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60 transition-all"
          style={{ width: `${Math.max(5, d.proportion * 100)}%` }}
        />
      </div>
      <p className="text-[9px] text-muted-foreground/60 mt-0.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        click for details
      </p>
    </div>
  );
}
