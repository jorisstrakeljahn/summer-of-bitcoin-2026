/**
 * Transaction flow diagram.
 *
 * Renders a React Flow graph showing how value moves from inputs
 * through the transaction node to outputs and the mining fee.
 * Edge thickness is proportional to the value being transferred.
 *
 * For transactions with many inputs/outputs, only the first 8 are
 * shown as individual nodes; the rest are collapsed into a "+N more"
 * placeholder to keep the diagram readable.
 *
 * Color coding:
 *   Blue   — Inputs (UTXOs being spent)
 *   Green  — Payment outputs
 *   Yellow — Change output (back to sender's wallet)
 *   Red    — Mining fee (value consumed, not an actual output)
 *   Purple — Transaction node (central hub)
 */

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
import type { BuildReport } from "@/lib/coin-smith/core";

// ── Color scheme ───────────────────────────────────────────────────

const COLORS = {
  input: "#3b82f6",
  payment: "#22c55e",
  change: "#eab308",
  fee: "#ef4444",
  tx: "#8b5cf6",
} as const;

const MAX_VISIBLE = 8;

// ── Helpers ────────────────────────────────────────────────────────

function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k`;
  return `${sats}`;
}

/**
 * Creates a flow node with consistent styling.
 * All nodes share the same dark background and mono font; they
 * differ only in border color, label, and position.
 */
function makeNode(
  id: string,
  x: number,
  y: number,
  label: string,
  borderColor: string,
  overrides: Partial<Node["style"]> = {},
): Node {
  return {
    id,
    position: { x, y },
    data: { label },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      background: "var(--card)",
      border: `2px solid ${borderColor}`,
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "12px",
      color: "var(--card-foreground)",
      fontFamily: "monospace",
      minWidth: "120px",
      textAlign: "center" as const,
      ...overrides,
    },
  };
}

function makeOverflowNode(id: string, x: number, y: number, count: number, color: string): Node {
  return makeNode(id, x, y, `+${count} more`, color, {
    border: `1px dashed ${color}`,
    fontSize: "11px",
    color: "var(--muted-foreground)",
  });
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  color: string,
  width: number,
  dashed = false,
): Edge {
  return {
    id,
    source,
    target,
    animated: false,
    style: {
      stroke: color,
      strokeWidth: width,
      opacity: dashed ? 0.4 : 0.6,
      ...(dashed && { strokeDasharray: "4 4" }),
    },
  };
}

// ── Graph builder ──────────────────────────────────────────────────

function buildGraph(report: BuildReport): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const totalInput = report.selected_inputs.reduce((s, i) => s + i.value_sats, 0);
  const edgeWidth = (value: number) => Math.max(1, (value / totalInput) * 6);

  const inputsToShow = report.selected_inputs.slice(0, MAX_VISIBLE);
  const hiddenInputs = report.selected_inputs.length - inputsToShow.length;
  const outputsToShow = report.outputs.slice(0, MAX_VISIBLE);
  const hiddenOutputs = report.outputs.length - outputsToShow.length;

  const inputCount = inputsToShow.length + (hiddenInputs > 0 ? 1 : 0);
  const outputCount = outputsToShow.length + (hiddenOutputs > 0 ? 1 : 0) + 1;
  const maxCount = Math.max(inputCount, outputCount);
  const spacing = 80;
  const totalHeight = maxCount * spacing;
  const inputStartY = (totalHeight - inputCount * spacing) / 2;
  const outputStartY = (totalHeight - outputCount * spacing) / 2;

  // Inputs
  inputsToShow.forEach((input, i) => {
    nodes.push(makeNode(`input-${i}`, 0, inputStartY + i * spacing, `${formatSats(input.value_sats)} sats`, COLORS.input));
    edges.push(makeEdge(`e-input-${i}`, `input-${i}`, "tx", COLORS.input, edgeWidth(input.value_sats)));
  });

  if (hiddenInputs > 0) {
    const y = inputStartY + inputsToShow.length * spacing;
    nodes.push(makeOverflowNode("input-more", 0, y, hiddenInputs, COLORS.input));
    edges.push(makeEdge("e-input-more", "input-more", "tx", COLORS.input, 1, true));
  }

  // Central TX node
  nodes.push(makeNode("tx", 220, totalHeight / 2 - 30, `TX\n${report.vbytes} vB`, COLORS.tx, {
    borderRadius: "12px",
    padding: "12px 16px",
    minWidth: "80px",
    whiteSpace: "pre-line" as const,
  }));

  // Outputs
  outputsToShow.forEach((output, i) => {
    const color = output.is_change ? COLORS.change : COLORS.payment;
    const label = output.is_change
      ? `${formatSats(output.value_sats)} change`
      : `${formatSats(output.value_sats)} sats`;

    nodes.push(makeNode(`output-${i}`, 440, outputStartY + i * spacing, label, color));
    edges.push(makeEdge(`e-output-${i}`, "tx", `output-${i}`, color, edgeWidth(output.value_sats)));
  });

  if (hiddenOutputs > 0) {
    const y = outputStartY + outputsToShow.length * spacing;
    nodes.push(makeOverflowNode("output-more", 440, y, hiddenOutputs, COLORS.payment));
    edges.push(makeEdge("e-output-more", "tx", "output-more", COLORS.payment, 1, true));
  }

  // Fee node (always last on the output side)
  const feeIdx = outputsToShow.length + (hiddenOutputs > 0 ? 1 : 0);
  nodes.push(makeNode("fee", 440, outputStartY + feeIdx * spacing, `${formatSats(report.fee_sats)} fee`, COLORS.fee, {
    color: COLORS.fee,
  }));
  edges.push(makeEdge("e-fee", "tx", "fee", COLORS.fee, edgeWidth(report.fee_sats)));

  return { nodes, edges };
}

// ── Legend ──────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: COLORS.input, label: "Inputs" },
  { color: COLORS.payment, label: "Payments" },
  { color: COLORS.change, label: "Change" },
  { color: COLORS.fee, label: "Fee" },
];

// ── Main component ─────────────────────────────────────────────────

interface TransactionFlowProps {
  report: BuildReport;
}

export function TransactionFlow({ report }: TransactionFlowProps) {
  const { nodes, edges } = useMemo(() => buildGraph(report), [report]);

  const inputCount = Math.min(report.selected_inputs.length, MAX_VISIBLE) + (report.selected_inputs.length > MAX_VISIBLE ? 1 : 0);
  const outputCount = Math.min(report.outputs.length, MAX_VISIBLE) + (report.outputs.length > MAX_VISIBLE ? 1 : 0) + 1;
  const flowHeight = Math.max(300, Math.max(inputCount, outputCount) * 80 + 40);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 50);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-medium">Transaction Flow</h2>
        <p className="text-sm text-muted-foreground">
          This diagram shows how value moves through the transaction. Inputs (coins from your
          wallet) flow into the transaction, which distributes them to payment outputs and —
          if there is leftover — a change output back to you. The mining fee is the difference
          between total inputs and total outputs.
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        </ReactFlow>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {LEGEND_ITEMS.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: color }} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
