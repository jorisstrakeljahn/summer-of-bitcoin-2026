"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface FlowFeeData {
  sats: number;
  rate: number;
  proportion: number;
}

export function FlowFeeNode({ data }: NodeProps) {
  const d = data as unknown as FlowFeeData;

  return (
    <div className="relative rounded-lg border border-dashed border-amber-500/50 bg-card px-3 py-2 text-xs shadow-sm">
      <div className="text-center font-semibold text-amber-500">Fee</div>
      <p className="mt-1 text-center font-mono font-medium">
        {d.sats.toLocaleString()} sat
      </p>
      <p className="text-center text-[10px] text-muted-foreground">
        {d.rate.toFixed(1)} sat/vB
      </p>
      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
    </div>
  );
}
