/**
 * Builds and renders the transaction flow graph (inputs → tx → outputs/fee).
 */
"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowInputNode } from "./flow-input-node";
import { FlowOutputNode } from "./flow-output-node";
import { FlowTxNode } from "./flow-tx-node";
import { FlowFeeNode } from "./flow-fee-node";
import type { TxDetailResponse } from "@/lib/sherlock/block-cache-types";

const nodeTypes = {
  flowInput: FlowInputNode,
  flowOutput: FlowOutputNode,
  flowTx: FlowTxNode,
  flowFee: FlowFeeNode,
};

const NODE_H = 90;
const NODE_GAP = 10;
const INPUT_X = 0;
const TX_X = 220;
const OUTPUT_X = 380;
const FEE_X = 380;

function clampThickness(value: number, total: number): number {
  if (total <= 0) return 2;
  const ratio = value / total;
  return Math.max(1.5, Math.min(8, ratio * 20));
}

function buildGraph(tx: TxDetailResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const totalIn = tx.total_input_sats || 1;
  const totalOut = tx.total_output_sats + tx.fee_sats || 1;

  const inputCount = tx.vin.length;
  const outputCount = tx.vout.length + (tx.fee_sats > 0 ? 1 : 0);
  const maxSide = Math.max(inputCount, outputCount);
  const totalInputH = inputCount * (NODE_H + NODE_GAP);
  const totalOutputH = outputCount * (NODE_H + NODE_GAP);

  const inputStartY = (maxSide * (NODE_H + NODE_GAP) - totalInputH) / 2;
  const outputStartY = (maxSide * (NODE_H + NODE_GAP) - totalOutputH) / 2;

  tx.vin.forEach((inp, i) => {
    const id = `in-${i}`;
    nodes.push({
      id,
      type: "flowInput",
      position: { x: INPUT_X, y: inputStartY + i * (NODE_H + NODE_GAP) },
      data: {
        label: `Input #${i}`,
        address: inp.address,
        sats: inp.value_sats,
        scriptType: inp.script_type,
        proportion: totalIn > 0 ? inp.value_sats / totalIn : 0,
        hasTimelock: inp.has_timelock,
      },
    });
    edges.push({
      id: `e-${id}-tx`,
      source: id,
      target: "tx",
      style: { strokeWidth: clampThickness(inp.value_sats, totalIn) },
    });
  });

  const txY =
    (maxSide * (NODE_H + NODE_GAP)) / 2 - NODE_H / 2;
  nodes.push({
    id: "tx",
    type: "flowTx",
    position: { x: TX_X, y: txY },
    data: {
      txid: tx.txid,
      segwit: tx.segwit,
      version: tx.version,
    },
  });

  tx.vout.forEach((out, i) => {
    const id = `out-${i}`;
    nodes.push({
      id,
      type: "flowOutput",
      position: { x: OUTPUT_X, y: outputStartY + i * (NODE_H + NODE_GAP) },
      data: {
        label: `Output #${i}`,
        address: out.address,
        sats: out.value_sats,
        scriptType: out.script_type,
        proportion: totalOut > 0 ? out.value_sats / totalOut : 0,
        isDust: out.is_dust,
        isOpReturn: out.is_op_return,
      },
    });
    edges.push({
      id: `e-tx-${id}`,
      source: "tx",
      target: id,
      style: { strokeWidth: clampThickness(out.value_sats, totalOut) },
    });
  });

  if (tx.fee_sats > 0) {
    const feeIdx = tx.vout.length;
    nodes.push({
      id: "fee",
      type: "flowFee",
      position: {
        x: FEE_X,
        y: outputStartY + feeIdx * (NODE_H + NODE_GAP),
      },
      data: {
        sats: tx.fee_sats,
        rate: tx.fee_rate_sat_vb,
        proportion: totalOut > 0 ? tx.fee_sats / totalOut : 0,
      },
    });
    edges.push({
      id: "e-tx-fee",
      source: "tx",
      target: "fee",
      style: {
        strokeWidth: clampThickness(tx.fee_sats, totalOut),
        strokeDasharray: "5 3",
      },
    });
  }

  return { nodes, edges };
}

interface Props {
  txDetail: TxDetailResponse;
}

export function TransactionFlow({ txDetail }: Props) {
  const { nodes, edges } = useMemo(
    () => buildGraph(txDetail),
    [txDetail],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
      />
    </div>
  );
}
