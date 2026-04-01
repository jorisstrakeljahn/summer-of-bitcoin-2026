/**
 * ReactFlow node that displays the transaction fee amount and rate.
 */
"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export interface FlowFeeData extends Record<string, unknown> {
  sats: number;
  rate: number;
  proportion: number;
}

type FlowFeeNodeType = Node<FlowFeeData, "flowFee">;

export function FlowFeeNode({ data: d }: NodeProps<FlowFeeNodeType>) {

  return (
    <div className="relative rounded-lg border border-dashed border-amber-500/50 bg-card px-3 py-2 text-xs shadow-sm">
      <div className="text-center font-semibold text-amber-500">Fee</div>
      <p className="mt-1 text-center font-mono font-medium">
        {d.sats.toLocaleString()} sat
      </p>
      <p className="text-center text-[10px] text-muted-foreground">
        {d.rate.toFixed(1)} sat/vB
      </p>
      <Handle type="target" position={Position.Left} className="bg-amber-500!" />
    </div>
  );
}
