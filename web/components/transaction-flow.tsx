"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  Position,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { BuildReport } from "@/lib/core";

interface TransactionFlowProps {
  report: BuildReport;
}

function truncate(s: string, len = 10): string {
  if (s.length <= len) return s;
  const half = Math.floor((len - 1) / 2);
  return `${s.slice(0, half)}…${s.slice(-half)}`;
}

function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k`;
  return `${sats}`;
}

const INPUT_COLOR = "#3b82f6";
const PAYMENT_COLOR = "#22c55e";
const CHANGE_COLOR = "#eab308";
const FEE_COLOR = "#ef4444";
const TX_COLOR = "#8b5cf6";

export function TransactionFlow({ report }: TransactionFlowProps) {
  const totalInput = report.selected_inputs.reduce((s, i) => s + i.value_sats, 0);

  const maxVisible = 8;
  const inputsToShow = report.selected_inputs.slice(0, maxVisible);
  const hiddenInputs = report.selected_inputs.length - inputsToShow.length;
  const outputsToShow = report.outputs.slice(0, maxVisible);
  const hiddenOutputs = report.outputs.length - outputsToShow.length;

  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    const inputCount = inputsToShow.length + (hiddenInputs > 0 ? 1 : 0);
    const outputCount = outputsToShow.length + (hiddenOutputs > 0 ? 1 : 0) + 1;
    const maxCount = Math.max(inputCount, outputCount);
    const spacing = 80;
    const totalHeight = maxCount * spacing;
    const inputStartY = (totalHeight - inputCount * spacing) / 2;
    const outputStartY = (totalHeight - outputCount * spacing) / 2;

    inputsToShow.forEach((input, i) => {
      nodeList.push({
        id: `input-${i}`,
        position: { x: 0, y: inputStartY + i * spacing },
        data: {
          label: `${formatSats(input.value_sats)} sats`,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: "#1e293b",
          border: `2px solid ${INPUT_COLOR}`,
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
          color: "#e2e8f0",
          fontFamily: "monospace",
          minWidth: "120px",
          textAlign: "center" as const,
        },
      });

      const w = Math.max(1, (input.value_sats / totalInput) * 6);
      edgeList.push({
        id: `e-input-${i}`,
        source: `input-${i}`,
        target: "tx",
        animated: false,
        style: { stroke: INPUT_COLOR, strokeWidth: w, opacity: 0.6 },
      });
    });

    if (hiddenInputs > 0) {
      const idx = inputsToShow.length;
      nodeList.push({
        id: "input-more",
        position: { x: 0, y: inputStartY + idx * spacing },
        data: { label: `+${hiddenInputs} more` },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: "#1e293b",
          border: `1px dashed ${INPUT_COLOR}`,
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          color: "#94a3b8",
          fontFamily: "monospace",
          minWidth: "120px",
          textAlign: "center" as const,
        },
      });
      edgeList.push({
        id: "e-input-more",
        source: "input-more",
        target: "tx",
        style: { stroke: INPUT_COLOR, strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 },
      });
    }

    nodeList.push({
      id: "tx",
      position: { x: 220, y: totalHeight / 2 - 30 },
      data: { label: `TX\n${report.vbytes} vB` },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "#1e293b",
        border: `2px solid ${TX_COLOR}`,
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "12px",
        color: "#e2e8f0",
        fontFamily: "monospace",
        minWidth: "80px",
        textAlign: "center" as const,
        whiteSpace: "pre-line" as const,
      },
    });

    outputsToShow.forEach((output, i) => {
      const color = output.is_change ? CHANGE_COLOR : PAYMENT_COLOR;
      const label = output.is_change
        ? `${formatSats(output.value_sats)} change`
        : `${formatSats(output.value_sats)} sats`;

      nodeList.push({
        id: `output-${i}`,
        position: { x: 440, y: outputStartY + i * spacing },
        data: { label },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: "#1e293b",
          border: `2px solid ${color}`,
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
          color: "#e2e8f0",
          fontFamily: "monospace",
          minWidth: "120px",
          textAlign: "center" as const,
        },
      });

      const w = Math.max(1, (output.value_sats / totalInput) * 6);
      edgeList.push({
        id: `e-output-${i}`,
        source: "tx",
        target: `output-${i}`,
        style: { stroke: color, strokeWidth: w, opacity: 0.6 },
      });
    });

    if (hiddenOutputs > 0) {
      const idx = outputsToShow.length;
      nodeList.push({
        id: "output-more",
        position: { x: 440, y: outputStartY + idx * spacing },
        data: { label: `+${hiddenOutputs} more` },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: "#1e293b",
          border: `1px dashed ${PAYMENT_COLOR}`,
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          color: "#94a3b8",
          fontFamily: "monospace",
          minWidth: "120px",
          textAlign: "center" as const,
        },
      });
      edgeList.push({
        id: "e-output-more",
        source: "tx",
        target: "output-more",
        style: { stroke: PAYMENT_COLOR, strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 },
      });
    }

    const feeIdx = outputsToShow.length + (hiddenOutputs > 0 ? 1 : 0);
    nodeList.push({
      id: "fee",
      position: { x: 440, y: outputStartY + feeIdx * spacing },
      data: { label: `${formatSats(report.fee_sats)} fee` },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "#1e293b",
        border: `2px solid ${FEE_COLOR}`,
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
        color: FEE_COLOR,
        fontFamily: "monospace",
        minWidth: "120px",
        textAlign: "center" as const,
      },
    });

    const feeW = Math.max(1, (report.fee_sats / totalInput) * 6);
    edgeList.push({
      id: "e-fee",
      source: "tx",
      target: "fee",
      style: { stroke: FEE_COLOR, strokeWidth: feeW, opacity: 0.5 },
    });

    return { nodes: nodeList, edges: edgeList };
  }, [report, inputsToShow, outputsToShow, hiddenInputs, hiddenOutputs, totalInput]);

  const itemCount = Math.max(
    inputsToShow.length + (hiddenInputs > 0 ? 1 : 0),
    outputsToShow.length + (hiddenOutputs > 0 ? 1 : 0) + 1,
  );
  const flowHeight = Math.max(300, itemCount * 80 + 40);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 50);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">Transaction Flow</h2>
        <p className="text-sm text-muted-foreground">
          Value flow from inputs through the transaction to outputs and mining fee.
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden" style={{ height: flowHeight }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={onInit}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          preventScrolling={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        </ReactFlow>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: INPUT_COLOR }} /> Inputs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: PAYMENT_COLOR }} /> Payments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: CHANGE_COLOR }} /> Change
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: FEE_COLOR }} /> Fee
        </span>
      </div>
    </div>
  );
}
