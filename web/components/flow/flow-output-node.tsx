/**
 * ReactFlow node for a transaction output (address, sats, script type, dust/OP_RETURN flags).
 */
"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { AlertTriangle, FileCode } from "lucide-react";

export interface FlowOutputData {
  label: string;
  address: string | null;
  sats: number;
  scriptType: string;
  proportion: number;
  isDust: boolean;
  isOpReturn: boolean;
}

type FlowOutputNode = Node<FlowOutputData, "flowOutput">;

export function FlowOutputNode({ data: d }: NodeProps<FlowOutputNode>) {
  const pct = Math.max(4, d.proportion * 100);

  return (
    <div className="relative w-44 rounded-lg border bg-card px-2.5 py-2 text-xs shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{d.label}</span>
        <div className="flex gap-1">
          {d.isDust && (
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          )}
          {d.isOpReturn && (
            <FileCode className="h-3 w-3 text-rose-500" />
          )}
        </div>
      </div>
      <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
        {d.isOpReturn ? "OP_RETURN" : d.address ?? "—"}
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
      <Handle type="target" position={Position.Left} className="bg-primary!" />
    </div>
  );
}
