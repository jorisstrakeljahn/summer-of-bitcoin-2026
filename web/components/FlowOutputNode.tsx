"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ScriptBadge } from "./ScriptBadge";
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

export function FlowOutputNode({ data }: NodeProps) {
  const d = data as unknown as FlowOutputData;
  const truncAddr = d.address
    ? `${d.address.slice(0, 6)}…${d.address.slice(-6)}`
    : d.isOpReturn ? "OP_RETURN" : "Unknown";

  return (
    <div
      title={d.isOpReturn ? "OP_RETURN: embedded data output (unspendable)" : `Sends ${d.sats.toLocaleString()} sat to ${d.address ?? "unknown address"} (${d.scriptType.toUpperCase()})`}
      className="group cursor-pointer rounded-lg border bg-card px-4 py-3 text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md min-w-[180px]"
    >
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-muted-foreground">{d.label}</p>
        <div className="flex items-center gap-1">
          {d.isDust && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
          {d.isOpReturn && <FileCode className="h-3 w-3 text-blue-400" />}
          <ScriptBadge type={d.scriptType} />
        </div>
      </div>
      <p className="font-mono text-xs mb-1.5">{truncAddr}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums font-medium">{d.sats.toLocaleString()} sat</span>
      </div>
      {!d.isOpReturn && (
        <div className="mt-1.5 h-1 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60 transition-all"
            style={{ width: `${Math.max(5, d.proportion * 100)}%` }}
          />
        </div>
      )}
      <p className="text-[9px] text-muted-foreground/60 mt-0.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        click for details
      </p>
    </div>
  );
}
