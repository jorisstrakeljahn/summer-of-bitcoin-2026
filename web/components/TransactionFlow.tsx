"use client";

import { useMemo } from "react";
import { ReactFlow, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TransactionReport } from "@/lib/types";
import { FlowInputNode } from "./FlowInputNode";
import { FlowOutputNode } from "./FlowOutputNode";
import { FlowTxNode } from "./FlowTxNode";
import { FlowFeeNode } from "./FlowFeeNode";
import { Card, CardContent } from "@/components/ui/card";

const nodeTypes = {
  flowInput: FlowInputNode,
  flowOutput: FlowOutputNode,
  flowTx: FlowTxNode,
  flowFee: FlowFeeNode,
};

interface TransactionFlowProps {
  report: TransactionReport;
}

function buildGraph(report: TransactionReport): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const NODE_W = 200;
  const NODE_H = 80;
  const COL_TX = 300;
  const COL_OUT = 600;

  const inputCount = report.vin.length;
  const outputCount = report.vout.length + 1; // +1 for fee node

  const inputTotalH = inputCount * (NODE_H + 20);
  const outputTotalH = outputCount * (NODE_H + 20);
  const totalH = Math.max(inputTotalH, outputTotalH);

  // TX center node
  nodes.push({
    id: "tx",
    type: "flowTx",
    position: { x: COL_TX, y: totalH / 2 - 30 },
    data: { txid: report.txid },
    draggable: false,
  });

  // Input nodes
  const inputStartY = (totalH - inputTotalH) / 2;
  report.vin.forEach((vin, i) => {
    const id = `in-${i}`;
    nodes.push({
      id,
      type: "flowInput",
      position: { x: 0, y: inputStartY + i * (NODE_H + 20) },
      data: {
        label: `Input #${i}`,
        address: vin.address,
        sats: vin.prevout.value_sats,
        scriptType: vin.script_type,
      },
      draggable: false,
    });
    edges.push({
      id: `e-${id}`,
      source: id,
      target: "tx",
      animated: true,
      style: { stroke: "hsl(var(--muted-foreground))" },
      label: `${vin.prevout.value_sats.toLocaleString()} sat`,
      labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.8 },
    });
  });

  // Output nodes
  const outputStartY = (totalH - outputTotalH) / 2;
  report.vout.forEach((vout, i) => {
    const id = `out-${i}`;
    nodes.push({
      id,
      type: "flowOutput",
      position: { x: COL_OUT, y: outputStartY + i * (NODE_H + 20) },
      data: {
        label: `Output #${i}`,
        address: vout.address,
        sats: vout.value_sats,
        scriptType: vout.script_type,
      },
      draggable: false,
    });
    edges.push({
      id: `e-${id}`,
      source: "tx",
      target: id,
      animated: true,
      style: { stroke: "hsl(var(--muted-foreground))" },
    });
  });

  // Fee node
  const feeIdx = report.vout.length;
  nodes.push({
    id: "fee",
    type: "flowFee",
    position: { x: COL_OUT, y: outputStartY + feeIdx * (NODE_H + 20) },
    data: { sats: report.fee_sats, rate: report.fee_rate_sat_vb },
    draggable: false,
  });
  edges.push({
    id: "e-fee",
    source: "tx",
    target: "fee",
    animated: true,
    style: { stroke: "oklch(0.705 0.191 47.604)", strokeDasharray: "5 3" },
  });

  return { nodes, edges };
}

export function TransactionFlow({ report }: TransactionFlowProps) {
  const { nodes, edges } = useMemo(() => buildGraph(report), [report]);

  const maxItems = Math.max(report.vin.length, report.vout.length + 1);
  const height = Math.max(300, maxItems * 100 + 40);

  return (
    <Card>
      <CardContent className="pt-6 pb-2">
        <p className="mb-3 text-xs text-muted-foreground">Value Flow</p>
        <div style={{ height }} className="rounded-lg border bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
