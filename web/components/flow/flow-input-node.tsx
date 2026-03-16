/**
 * ReactFlow node for a transaction input (address, sats, script type, proportion).
 */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";

export interface FlowInputData {
  label: string;
  address: string | null;
  sats: number;
  scriptType: string;
  proportion: number;
  hasTimelock: boolean;
}

export function FlowInputNode({ data }: NodeProps) {
  const d = data as unknown as FlowInputData;
  const pct = Math.max(4, d.proportion * 100);

  return (
    <div className="relative w-44 rounded-lg border bg-card px-2.5 py-2 text-xs shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{d.label}</span>
        {d.hasTimelock && <Clock className="h-3 w-3 text-amber-500" />}
      </div>
      <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
        {d.address ?? "—"}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono font-medium">
          {d.sats.toLocaleString()} sat
        </span>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
          {d.scriptType}
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
}
