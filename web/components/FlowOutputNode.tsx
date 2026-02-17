"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ScriptBadge } from "./ScriptBadge";

export interface FlowOutputData {
  label: string;
  address: string | null;
  sats: number;
  scriptType: string;
}

export function FlowOutputNode({ data }: NodeProps) {
  const d = data as unknown as FlowOutputData;
  const truncAddr = d.address
    ? `${d.address.slice(0, 6)}…${d.address.slice(-6)}`
    : d.scriptType === "op_return" ? "OP_RETURN" : "Unknown";

  return (
    <div className="rounded-lg border bg-card px-4 py-3 text-card-foreground shadow-sm min-w-[170px]">
      <Handle type="target" position={Position.Left} className="bg-primary! w-2! h-2!" />
      <p className="text-[10px] text-muted-foreground mb-1">{d.label}</p>
      <p className="font-mono text-xs mb-1.5">{truncAddr}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums">{d.sats.toLocaleString()} sat</span>
        <ScriptBadge type={d.scriptType} />
      </div>
    </div>
  );
}
