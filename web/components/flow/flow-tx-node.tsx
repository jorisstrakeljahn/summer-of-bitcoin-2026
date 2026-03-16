/**
 * ReactFlow node for the central transaction card (TXID, SegWit, version).
 */
"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export interface FlowTxData {
  txid: string;
  segwit: boolean;
  version: number;
}

type FlowTxNode = Node<FlowTxData, "flowTx">;

export function FlowTxNode({ data: d }: NodeProps<FlowTxNode>) {

  return (
    <div className="relative rounded-lg border-2 border-primary bg-card px-4 py-3 text-xs shadow-md">
      <div className="text-center font-semibold text-primary">Transaction</div>
      <p className="mt-1 text-center font-mono text-[10px] text-muted-foreground">
        {d.txid.slice(0, 8)}...{d.txid.slice(-8)}
      </p>
      <div className="mt-1 flex justify-center gap-2">
        {d.segwit && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            SegWit
          </span>
        )}
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
          v{d.version}
        </span>
      </div>
      <Handle type="target" position={Position.Left} className="bg-primary!" />
      <Handle type="source" position={Position.Right} className="bg-primary!" />
    </div>
  );
}
